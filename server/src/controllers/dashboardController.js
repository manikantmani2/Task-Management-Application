import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const canManageTask = (role) => ['admin', 'manager'].includes(role);

const getVisibilityFilter = (user) => {
  const userId = new mongoose.Types.ObjectId(user.id);

  if (canManageTask(user.role)) {
    return {};
  }

  return {
    $or: [{ assignee: userId }, { createdBy: userId }]
  };
};

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const filter = getVisibilityFilter(req.user);

  const [summary] = await Task.aggregate([
    { $match: filter },
    {
      $facet: {
        statusCounts: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        priorityCounts: [
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ],
        overdue: [
          {
            $match: {
              dueDate: { $lt: new Date() },
              status: { $ne: 'done' }
            }
          },
          { $count: 'count' }
        ],
        dueSoon: [
          {
            $match: {
              dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
              status: { $ne: 'done' }
            }
          },
          { $count: 'count' }
        ],
        recentTasks: [
          { $sort: { updatedAt: -1 } },
          { $limit: 5 }
        ]
      }
    }
  ]);

  const totalTasks = await Task.countDocuments(filter);
  const completed = await Task.countDocuments({ ...filter, status: 'done' });

  res.json({
    totalTasks,
    completedTasks: completed,
    completionRate: totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100),
    statusCounts: summary?.statusCounts || [],
    priorityCounts: summary?.priorityCounts || [],
    overdueTasks: summary?.overdue?.[0]?.count || 0,
    dueSoonTasks: summary?.dueSoon?.[0]?.count || 0,
    recentTasks: summary?.recentTasks || []
  });
});