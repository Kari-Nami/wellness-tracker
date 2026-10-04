import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from 'mongoose';
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 200 },
    active: { type: Boolean, default: true, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: 'throw', collection: 'habits' },
);
schema.index({ userId: 1, deletedAt: 1 });
schema.index({ userId: 1, active: 1 });
export type HabitRecord = InferSchemaType<typeof schema>;
export const Habit: Model<HabitRecord> =
  (models.Habit as Model<HabitRecord> | undefined) ?? model('Habit', schema);
