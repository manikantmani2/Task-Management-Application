import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Task } from '../src/models/Task.js';
import { Notification } from '../src/models/Notification.js';
import { hashPassword } from '../src/utils/password.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_management';

const userSeeds = [
  { name: 'Ava Stone', email: 'admin@taskflow.local', password: 'Admin123!', role: 'admin', title: 'Product Admin' },
  { name: 'Noah Reed', email: 'manager@taskflow.local', password: 'Manager123!', role: 'manager', title: 'Delivery Manager' },
  { name: 'Mia Chen', email: 'user@taskflow.local', password: 'User123!', role: 'user', title: 'Frontend Engineer' }
];

const taskSeeds = [
  {
    title: 'Finalize sprint backlog',
    description: 'Review priorities and lock scope for the next release.',
    status: 'todo',
    priority: 'high',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    estimateHours: 3,
    tags: ['planning', 'sprint']
  },
  {
    title: 'Implement dashboard filters',
    description: 'Add board search, priority filters, and quick actions.',
    status: 'in-progress',
    priority: 'medium',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    estimateHours: 6,
    tags: ['frontend', 'ux']
  },
  {
    title: 'QA release candidate',
    description: 'Verify task state sync and notification behavior.',
    status: 'review',
    priority: 'urgent',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    estimateHours: 4,
    tags: ['qa', 'release']
  },
  {
    title: 'Migrate archived tasks',
    description: 'Move completed work into the archive pipeline.',
    status: 'done',
    priority: 'low',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    estimateHours: 2,
    tags: ['backend', 'maintenance']
  }
];

// Additional pre-assigned tasks to specific users / projects
const preAssigned = [
  {
    title: 'Onboard new contractor - setup env',
    description: 'Ensure the contractor has repo access and local env configured.',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    estimateHours: 2,
    tags: ['onboarding'],
    project: 'Alpha',
    preAssigned: true
  },
  {
    title: 'Integrations smoke tests',
    description: 'Run smoke tests for third-party integrations and report failures.',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    estimateHours: 5,
    tags: ['testing', 'integrations'],
    project: 'Beta',
    preAssigned: true
  }
];

const runSeed = async () => {
  await connectDatabase(mongoUri);

  await Promise.all([
    Task.deleteMany({}),
    Notification.deleteMany({}),
    User.deleteMany({})
  ]);

  const insertedUsers = await User.insertMany(
    await Promise.all(
      userSeeds.map(async (user) => ({
        ...user,
        passwordHash: await hashPassword(user.password)
      }))
    )
  );

  const userMap = Object.fromEntries(insertedUsers.map((user) => [user.role, user]));

  await Task.insertMany(
    taskSeeds.map((task, index) => ({
      ...task,
      createdBy: userMap.admin._id,
      assignee: index % 2 === 0 ? userMap.manager._id : userMap.user._id,
      watchers: [userMap.admin._id, userMap.manager._id],
      position: index
    }))
  );

  // Insert pre-assigned tasks with explicit assignees
  await Task.insertMany(
    preAssigned.map((task, idx) => ({
      ...task,
      createdBy: userMap.manager._id,
      // alternate assignments: first to manager, second to regular user
      assignee: idx % 2 === 0 ? userMap.manager._id : userMap.user._id,
      watchers: [userMap.admin._id],
      position: taskSeeds.length + idx
    }))
  );

  console.log('Seed completed successfully');
};

runSeed()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });