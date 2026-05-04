import { User } from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    filter.role = role;
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ users: users.map((user) => ({ ...user, id: user._id.toString() })) });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.role = req.body.role;
  await user.save();

  res.json({ user: user.toSafeJSON() });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.active = !user.active;
  await user.save();

  res.json({ user: user.toSafeJSON() });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ user });
});