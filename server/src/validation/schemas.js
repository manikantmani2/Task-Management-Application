import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const authSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    email: z.string().email(),
    password: z.string().min(8).max(120)
  })
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(120)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(120)
  })
});

export const taskCreateSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(140),
    description: z.string().max(5000).optional().default(''),
    status: z.enum(['todo', 'in-progress', 'review', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().datetime().optional(),
    estimateHours: z.number().nonnegative().optional(),
    tags: z.array(z.string().min(1).max(32)).optional(),
    assigneeId: objectId.optional(),
    watchers: z.array(objectId).optional()
  })
});

export const taskUpdateSchema = z.object({
  params: z.object({
    taskId: objectId
  }),
  body: z.object({
    title: z.string().min(3).max(140).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(['todo', 'in-progress', 'review', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    estimateHours: z.number().nonnegative().nullable().optional(),
    tags: z.array(z.string().min(1).max(32)).optional(),
    assigneeId: objectId.nullable().optional(),
    watchers: z.array(objectId).optional(),
    position: z.number().int().nonnegative().optional()
  })
});

export const taskAssignSchema = z.object({
  params: z.object({
    taskId: objectId
  }),
  body: z.object({
    assigneeId: objectId
  })
});

export const taskReorderSchema = z.object({
  params: z.object({
    taskId: objectId
  }),
  body: z.object({
    position: z.number().int().nonnegative(),
    status: z.enum(['todo', 'in-progress', 'review', 'done']).optional()
  })
});

export const taskIdSchema = z.object({
  params: z.object({
    taskId: objectId
  })
});

export const userIdSchema = z.object({
  params: z.object({
    userId: objectId
  })
});

export const roleUpdateSchema = z.object({
  params: z.object({
    userId: objectId
  }),
  body: z.object({
    role: z.enum(['admin', 'manager', 'user'])
  })
});