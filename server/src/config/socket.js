import { verifyToken } from '../utils/jwt.js';

export const configureSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    try {
      const payload = verifyToken(token);
      socket.data.user = payload;
      socket.join(`user:${payload.id}`);
      socket.join(`role:${payload.role}`);
      return next();
    } catch (error) {
      return next(error);
    }
  });

  io.on('connection', (socket) => {
    socket.emit('socket:ready', {
      user: socket.data.user
    });
  });
};