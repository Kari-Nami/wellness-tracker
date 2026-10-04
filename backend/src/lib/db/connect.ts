import mongoose from 'mongoose';
import { getEnv } from '../env';
const state = globalThis as typeof globalThis & {
  wellnessMongo?: Promise<typeof mongoose>;
};
export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose;
  state.wellnessMongo ??= mongoose.connect(getEnv().MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  try {
    return await state.wellnessMongo;
  } finally {
    state.wellnessMongo = undefined;
  }
}
