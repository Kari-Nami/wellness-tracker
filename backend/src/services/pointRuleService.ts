import { PointRule } from '../models/PointRule';
import { initializeDb } from '../lib/db/initialize';
import { withUserTransaction } from '../lib/db/transaction';
import { AppError } from '../lib/http';
import { toPointRuleDto } from '../lib/dto';
import {
  idSchema,
  pointRuleInputSchema,
  pointRulePatchSchema,
} from '../types/contracts';
function assertAdmin(role: string) {
  if (role !== 'admin')
    throw new AppError(
      403,
      'FORBIDDEN',
      'This page is available to administrators only.',
    );
}
export async function listPointRules() {
  await initializeDb();
  return (await PointRule.find({}).sort({ createdAt: 1, _id: 1 })).map(
    toPointRuleDto,
  );
}
export async function createPointRule(adminId: string, payload: unknown) {
  const input = pointRuleInputSchema.parse(payload);
  return withUserTransaction(adminId, async (user, session) => {
    assertAdmin(user.role);
    const [rule] = await PointRule.create([input], { session });
    return toPointRuleDto(rule);
  });
}
export async function updatePointRule(
  adminId: string,
  id: string,
  payload: unknown,
) {
  idSchema.parse(id);
  const input = pointRulePatchSchema.parse(payload);
  return withUserTransaction(adminId, async (user, session) => {
    assertAdmin(user.role);
    const rule = await PointRule.findById(id).session(session);
    if (!rule)
      throw new AppError(
        404,
        'NOT_FOUND',
        'This point rule could not be found.',
      );
    rule.set(input);
    await rule.save({ session });
    return toPointRuleDto(rule);
  });
}
export async function deletePointRule(adminId: string, id: string) {
  idSchema.parse(id);
  return withUserTransaction(adminId, async (user, session) => {
    assertAdmin(user.role);
    const result = await PointRule.deleteOne({ _id: id }).session(session);
    if (!result.deletedCount)
      throw new AppError(
        404,
        'NOT_FOUND',
        'This point rule could not be found.',
      );
  });
}
