import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from 'mongoose';
import {
  DEFAULT_GOALS,
  bowelStatusSchema,
  THAILAND_TIMEZONE,
} from '../types/contracts';
import { DEMO_ACCOUNTS } from '../types/demoAccounts';
const goals = new Schema(
  {
    sleepHours: { type: Number, default: null, min: 0, max: 24 },
    waterMl: { type: Number, default: null, min: 0, max: 10000 },
    mealsPerDay: { type: Number, default: null, min: 0, max: 10 },
    targetMood: { type: Number, default: null, enum: [1, 2, 3, 4, 5] },
    targetBowelStatus: {
      type: String,
      default: null,
      enum: [null, ...bowelStatusSchema.options],
    },
  },
  { _id: false },
);
const schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, maxlength: 50 },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },
    timezone: { type: String, required: true, default: THAILAND_TIMEZONE },
    goals: {
      type: goals,
      default: () => ({ ...DEFAULT_GOALS }),
      required: true,
    },
    leaderboardEnabled: { type: Boolean, default: true, required: true },
    demoKey: {
      type: String,
      enum: DEMO_ACCOUNTS.map((a) => a.key),
      unique: true,
      sparse: true,
    },
    demoHabitIds: { type: [Schema.Types.ObjectId], default: [] },
    mutationRevision: { type: Number, default: 0, required: true },
  },
  { timestamps: true, strict: 'throw', collection: 'users' },
);
schema.index({ role: 1, leaderboardEnabled: 1 });
export type UserRecord = InferSchemaType<typeof schema>;
export const User: Model<UserRecord> =
  (models.User as Model<UserRecord> | undefined) ?? model('User', schema);
