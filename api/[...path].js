let cachedHandler;

const loadHandler = async () => {
  if (!cachedHandler) {
    const { default: app } = await import('../server/src/app.js');
    cachedHandler = app;
  }

  return cachedHandler;
};

const connectOnce = async () => {
  const { connectDatabase } = await import('../server/src/config/db.js');
  await connectDatabase(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_management');
};

module.exports = async (req, res) => {
  await connectOnce();
  const handler = await loadHandler();
  return handler(req, res);
};