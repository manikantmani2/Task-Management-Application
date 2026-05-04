import { Router } from 'express';
import {
  assignTask,
  createTask,
  deleteTask,
  getBoardTasks,
  getTask,
  listTasks,
  reorderTask,
  updateTask
} from '../controllers/taskController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { taskAssignSchema, taskCreateSchema, taskIdSchema, taskReorderSchema, taskUpdateSchema } from '../validation/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/board', getBoardTasks);
router.get('/', listTasks);
router.get('/:taskId', validate(taskIdSchema), getTask);
router.post('/', validate(taskCreateSchema), createTask);
router.patch('/:taskId', validate(taskUpdateSchema), updateTask);
router.patch('/:taskId/assign', authorizeRoles('admin', 'manager'), validate(taskAssignSchema), assignTask);
router.patch('/:taskId/reorder', authorizeRoles('admin', 'manager'), validate(taskReorderSchema), reorderTask);
router.delete('/:taskId', validate(taskIdSchema), deleteTask);

export default router;