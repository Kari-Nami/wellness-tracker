import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from 'mongoose';
import {
  alcoholStatusSchema,
  bowelStatusSchema,
  sleepQualitySchema,
  triggerKeySchema,
  MAX_WATER_ML,
} from '../types/contracts';
const meal = new Schema(
  {
    status: {
      type: String,
      enum: ['not_logged', 'eaten', 'skipped'],
      required: true,
      default: 'not_logged',
    },
    description: { type: String, maxlength: 200 },
  },
  { _id: false },
);
const sleep = new Schema(
  {
    durationMinutes: { type: Number, min: 0, max: 1440, default: null },
    quality: {
      type: String,
      enum: [null, ...sleepQualitySchema.options],
      default: null,
    },
  },
  { _id: false },
);
const meals = new Schema(
  {
    breakfast: {
      type: meal,
      default: () => ({ status: 'not_logged' }),
      required: true,
    },
    lunch: {
      type: meal,
      default: () => ({ status: 'not_logged' }),
      required: true,
    },
    dinner: {
      type: meal,
      default: () => ({ status: 'not_logged' }),
      required: true,
    },
    snacks: {
      type: [
        new Schema(
          { description: { type: String, required: true, maxlength: 200 } },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { _id: false },
);
const completion = new Schema(
  {
    habitId: { type: Schema.Types.ObjectId, required: true },
    habitNameSnapshot: { type: String, required: true },
    completed: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);
const award = new Schema(
  {
    triggerKey: {
      type: String,
      enum: triggerKeySchema.options,
      required: true,
    },
    instanceKey: { type: String, required: true },
    points: { type: Number, min: 0, max: 100, required: true },
    awardedAt: { type: Date, required: true },
  },
  { _id: false },
);
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    localDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    sleep: { type: sleep, default: () => ({}), required: true },
    waterMl: { type: Number, default: null, min: 0, max: MAX_WATER_ML },
    mood: { type: Number, default: null, enum: [1, 2, 3, 4, 5] },
    meals: { type: meals, default: () => ({}), required: true },
    alcoholStatus: {
      type: String,
      enum: [null, ...alcoholStatusSchema.options],
      default: null,
    },
    bowelStatus: {
      type: String,
      enum: [null, ...bowelStatusSchema.options],
      default: null,
    },
    habitCompletions: { type: [completion], default: [] },
    pointAwards: { type: [award], default: [] },
  },
  { timestamps: true, strict: 'throw', collection: 'dailyCheckIns' },
);
schema.index({ userId: 1, localDate: 1 }, { unique: true });
schema.index({ userId: 1, localDate: -1 });
export type CheckInRecord = InferSchemaType<typeof schema>;
export const DailyCheckIn: Model<CheckInRecord> =
  (models.DailyCheckIn as Model<CheckInRecord> | undefined) ??
  model('DailyCheckIn', schema);
