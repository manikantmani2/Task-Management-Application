import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import app from './app.js';
import { connectDatabase } from './config/db.js';
import { configureSocket } from './config/socket.js';

dotenv.config();

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_management';

const startServer = async () => {
  await connectDatabase(mongoUri);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  });

  configureSocket(io);
  app.set('io', io);

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});