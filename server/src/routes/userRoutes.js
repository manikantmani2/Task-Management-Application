import { Router } from 'express';
import { listUsers, toggleUserStatus, updateUserRole, getUser } from '../controllers/userController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { roleUpdateSchema, userIdSchema } from '../validation/schemas.js';

const router = Router();

// Require authentication for all user routes
router.use(authenticate);

// List and management endpoints require admin/manager
router.get('/', authorizeRoles('admin', 'manager'), listUsers);
router.get('/:userId', validate(userIdSchema), getUser);
router.patch('/:userId/role', authorizeRoles('admin', 'manager'), validate(roleUpdateSchema), updateUserRole);
router.patch('/:userId/status', authorizeRoles('admin', 'manager'), validate(userIdSchema), toggleUserStatus);

export default router;