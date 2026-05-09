import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Task } from '../src/models/Task.js';
import { Notification } from '../src/models/Notification.js';
import { hashPassword } from '../src/utils/password.js';
import { signToken } from '../src/utils/jwt.js';

let mongo;

const createUser = async (overrides = {}) =>
  User.create({
    name: overrides.name || 'Admin User',
    email: overrides.email || `user-${Date.now()}@taskflow.local`,
    passwordHash: await hashPassword(overrides.password || 'Password123!'),
    role: overrides.role || 'admin',
    title: overrides.title || 'Admin'
  });

const authHeader = (user) => ({
  Authorization: `Bearer ${signToken({ id: user._id.toString(), role: user.role, email: user.email })}`
});

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    Notification.deleteMany({})
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

describe('auth and task api', () => {
  it('registers a user and returns a token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@taskflow.local',
        password: 'Password123!'
      });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe('test@taskflow.local');
  });

  it('creates, updates, and deletes a task for an authenticated user', async () => {
    const user = await createUser();

    const createResponse = await request(app)
      .post('/api/tasks')
      .set(authHeader(user))
      .send({
        title: 'Write tests',
        description: 'Cover the core task flow',
        priority: 'high',
        status: 'todo',
        tags: ['testing']
      });

    expect(createResponse.status).toBe(200);
    const createdTask = await Task.findOne({ title: 'Write tests', createdBy: user._id });
    expect(createdTask).toBeTruthy();

    const taskId = createdTask._id;

    const updateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set(authHeader(user))
      .send({
        status: 'in-progress',
        priority: 'urgent',
        position: 2
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.task.status).toBe('in-progress');
    expect(updateResponse.body.task.priority).toBe('urgent');

    const deleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(authHeader(user));

    expect(deleteResponse.status).toBe(204);
  });

  it('returns dashboard summary data for accessible tasks', async () => {
    const user = await createUser();
    await Task.create({
      title: 'Board review',
      description: 'Review the current sprint board',
      status: 'done',
      priority: 'medium',
      createdBy: user._id,
      assignee: user._id,
      tags: ['board']
    });

    const response = await request(app)
      .get('/api/dashboard/summary')
      .set(authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body.totalTasks).toBe(1);
    expect(response.body.completedTasks).toBe(1);
  });
});