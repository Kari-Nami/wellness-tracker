import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from 'mongoose';
import { triggerKeySchema } from '../types/contracts';
const schema = new Schema(
  {
    triggerKey: {
      type: String,
      enum: triggerKeySchema.options,
      required: true,
      unique: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      validate: Number.isInteger,
    },
    enabled: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, strict: 'throw', collection: 'pointRules' },
);
export type PointRuleRecord = InferSchemaType<typeof schema>;
export const PointRule: Model<PointRuleRecord> =
  (models.PointRule as Model<PointRuleRecord> | undefined) ??
  model('PointRule', schema);
