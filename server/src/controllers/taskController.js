import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const canManageTask = (userRole) => ['admin', 'manager'].includes(userRole);

const getVisibilityFilter = (user) => {
  if (canManageTask(user.role)) {
    return {};
  }

  return {
    $or: [{ assignee: user.id }, { createdBy: user.id }]
  };
};

const populateTask = (query) =>
  query.populate([
    { path: 'assignee', select: 'name email role title avatarUrl active' },
    { path: 'createdBy', select: 'name email role title avatarUrl active' },
    { path: 'watchers', select: 'name email role title avatarUrl active' }
  ]);

const emitTaskActivity = async (req, task, eventName, extra = {}) => {
  const io = req.app.get('io');
  if (!io) {
    return;
  }

  io.emit(eventName, { task, ...extra });

  if (task.assignee) {
    io.to(`user:${task.assignee._id?.toString?.() || task.assignee.toString()}`).emit(eventName, {
      task,
      ...extra
    });
  }
};

const createNotification = async ({ userId, taskId, type, message, io }) => {
  const notification = await Notification.create({
    user: userId,
    task: taskId,
    type,
    message
  });

  const payload = {
    id: notification._id.toString(),
    task: notification.task,
    type: notification.type,
    message: notification.message,
    readAt: notification.readAt,
    createdAt: notification.createdAt
  };

  io.to(`user:${userId.toString()}`).emit('notification:new', payload);

  return notification;
};

export const listTasks = asyncHandler(async (req, res) => {
  const { status, priority, search, assigneeId, dueBefore, dueAfter, project, page = '1', limit = '20' } = req.query;
  const filter = {
    ...getVisibilityFilter(req.user)
  };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assigneeId) filter.assignee = assigneeId;
  if (project) filter.project = project;
  if (dueBefore || dueAfter) {
    filter.dueDate = {};
    if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
    if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const query = Task.find(filter)
    .sort({ position: 1, dueDate: 1, updatedAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  const tasks = await populateTask(query).lean();
  const total = await Task.countDocuments(filter);

  res.json({
    tasks,
    page: pageNumber,
    pageSize,
    total
  });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = populateTask(Task.findById(req.params.taskId));
  const doc = await task.lean();

  if (!doc) {
    throw new ApiError(404, 'Task not found');
  }

  const permitted = canManageTask(req.user.role) || doc.createdBy._id.toString() === req.user.id || doc.assignee?._id?.toString() === req.user.id;
  if (!permitted) {
    throw new ApiError(403, 'You do not have access to this task');
  }

  res.json({ task: doc });
});

export const createTask = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const payload = req.validated.body;

  let assignee = null;
  if (payload.assigneeId) {
    assignee = await User.findById(payload.assigneeId);
    if (!assignee) {
      throw new ApiError(404, 'Assignee not found');
    }
  }

  const task = await Task.create({
    title: payload.title,
    description: payload.description || '',
    status: payload.status || 'todo',
    priority: payload.priority || 'medium',
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    estimateHours: payload.estimateHours || 0,
    tags: payload.tags || [],
    assignee: assignee?._id,
    watchers: payload.watchers || [],
    createdBy: req.user.id,
    position: 0
  });

  const populatedTask = populateTask(Task.findById(task._id));
  const result = await populatedTask.lean();

  io.emit('task:created', result);
  if (assignee) {
    await createNotification({
      userId: assignee._id,
      taskId: task._id,
      type: 'task-assigned',
      message: `You were assigned to ${task.title}`,
      io
    });
  }

  res.status(201).json({ task: result });
});

export const updateTask = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { taskId } = req.params;
  const payload = req.validated.body;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const allowed = canManageTask(req.user.role) || task.createdBy.toString() === req.user.id || task.assignee?.toString() === req.user.id;
  if (!allowed) {
    throw new ApiError(403, 'You cannot update this task');
  }

  if (payload.title !== undefined) task.title = payload.title;
  if (payload.description !== undefined) task.description = payload.description;
  if (payload.status !== undefined) task.status = payload.status;
  if (payload.priority !== undefined) task.priority = payload.priority;
  if (payload.dueDate !== undefined) task.dueDate = payload.dueDate ? new Date(payload.dueDate) : undefined;
  if (payload.estimateHours !== undefined) task.estimateHours = payload.estimateHours ?? task.estimateHours;
  if (payload.tags !== undefined) task.tags = payload.tags;
  if (payload.position !== undefined) task.position = payload.position;

  if (payload.assigneeId !== undefined) {
    if (payload.assigneeId === null) {
      task.assignee = undefined;
    } else {
      const assignee = await User.findById(payload.assigneeId);
      if (!assignee) {
        throw new ApiError(404, 'Assignee not found');
      }
      task.assignee = assignee._id;
      await createNotification({
        userId: assignee._id,
        taskId: task._id,
        type: 'task-assigned',
        message: `You were assigned to ${task.title}`,
        io
      });
    }
  }

  if (payload.watchers !== undefined) {
    task.watchers = payload.watchers;
  }

  await task.save();

  const populatedTask = populateTask(Task.findById(task._id));
  const result = await populatedTask.lean();

  io.emit('task:updated', result);
  if (result.assignee) {
    await createNotification({
      userId: result.assignee._id,
      taskId: result._id,
      type: 'task-updated',
      message: `${result.title} was updated`,
      io
    });
  }

  res.json({ task: result });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const allowed = canManageTask(req.user.role) || task.createdBy.toString() === req.user.id;
  if (!allowed) {
    throw new ApiError(403, 'You cannot delete this task');
  }

  await Task.deleteOne({ _id: task._id });
  io.emit('task:deleted', { id: task._id.toString() });

  res.status(204).send();
});

export const assignTask = asyncHandler(async (req, res) => {
  if (!canManageTask(req.user.role)) {
    throw new ApiError(403, 'Only admins and managers can assign tasks');
  }

  const { taskId } = req.params;
  const { assigneeId } = req.body;
  const io = req.app.get('io');

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const assignee = await User.findById(assigneeId);
  if (!assignee) {
    throw new ApiError(404, 'Assignee not found');
  }

  task.assignee = assignee._id;
  await task.save();

  const populatedTask = populateTask(Task.findById(task._id));
  const result = await populatedTask.lean();

  io.emit('task:updated', result);
  await createNotification({
    userId: assignee._id,
    taskId: task._id,
    type: 'task-assigned',
    message: `You were assigned to ${task.title}`,
    io
  });

  res.json({ task: result });
});

export const reorderTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { position, status } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  task.position = position;
  if (status) {
    task.status = status;
  }

  await task.save();
  const populatedTask = populateTask(Task.findById(task._id));
  const result = await populatedTask.lean();

  req.app.get('io').emit('task:updated', result);
  res.json({ task: result });
});

export const getBoardTasks = asyncHandler(async (req, res) => {
  const filter = getVisibilityFilter(req.user);
  const tasks = await populateTask(
    Task.find(filter).sort({ position: 1, updatedAt: -1 })
  ).lean();

  const columns = ['todo', 'in-progress', 'review', 'done'].reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status);
    return acc;
  }, {});

  res.json({ columns });
});