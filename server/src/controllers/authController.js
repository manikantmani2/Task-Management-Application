import { User } from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

const createAuthResponse = (user) => ({
  user: user.toSafeJSON(),
  token: signToken({ id: user._id.toString(), role: user.role, email: user.email })
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already exists');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password)
  });

  res.status(201).json(createAuthResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email });
  if (!user || !user.active) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid credentials');
  }

  res.json(createAuthResponse(user));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ user: user.toSafeJSON() });
});