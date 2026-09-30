import type { InsightsDto } from '../types/contracts';
import type { InsightSource } from '../types/analytics';
import { notImplemented } from '../lib/http';
export function computeInsights(source: InsightSource): InsightsDto {
  void source;
  return notImplemented();
}
