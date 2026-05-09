import mongoose from 'mongoose';

const globalForMongoose = globalThis;
const cachedConnection = globalForMongoose.__mongooseConnection || {
  conn: null,
  promise: null
};

globalForMongoose.__mongooseConnection = cachedConnection;

export const connectDatabase = async (mongoUri) => {
  if (cachedConnection.conn) {
    return cachedConnection.conn;
  }

  if (!cachedConnection.promise) {
    mongoose.set('strictQuery', true);
    mongoose.set('bufferCommands', false);
    cachedConnection.promise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      })
      .then((connection) => connection);
  }

  cachedConnection.conn = await cachedConnection.promise;
  return cachedConnection.conn;
};