import { BowelIcon } from '../../components/ui/BowelIcon';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Moon,
  Droplets,
  Heart,
  CircleCheck,
  Flame,
  ArrowRight,
  Wine,
} from 'lucide-react';
import { insightsApi } from '../../api/insights';
import { queryKeys } from '../../api/queryKeys';
import { useAuth } from '../auth/context';
import { useToday } from '../../hooks/useToday';
import { shiftDate, formatDay } from '../../lib/dates';
import { sleepLabel, waterLabel, rateLabel, titleCase } from '../../lib/format';
import { dateRangeSchema, type DateRange } from '../../types/contracts';
import { PageHeading } from '../../components/ui/PageHeading';
import { Button } from '../../components/ui/Button';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '../../components/ui/States';
import { Progress } from '../../components/ui/Progress';
import { TrendChart } from '../../components/charts/TrendChart';
export function InsightsPage() {
  const { user } = useAuth();
  const today = useToday(user!.timezone);
  const [preset, setPreset] = useState('30');
  const [custom, setCustom] = useState<DateRange>({
    from: shiftDate(today, -29),
    to: today,
  });
  const [draftRange, setDraftRange] = useState(custom);
  const [rangeError, setRangeError] = useState('');
  const range =
    preset === 'custom'
      ? custom
      : { from: shiftDate(today, -(Number(preset) - 1)), to: today };
  const query = useQuery({
    queryKey: queryKeys.insights(range.from, range.to),
    queryFn: ({ signal }) => insightsApi.get(range, signal),
  });
  const data = query.data;
  function applyRange() {
    const result = dateRangeSchema.safeParse(draftRange);
    if (!result.success || draftRange.to > today) {
      setRangeError(
        'Choose an ordered range of up to 365 days, ending today or earlier.',
      );
      return;
    }
    setCustom(result.data);
    setRangeError('');
  }
  const summary = data?.summary;
  return (
    <>
      <PageHeading
        eyebrow="NOTICE YOUR PATTERNS"
        title="Insights"
        description="Review your wellness trends."
        action={
          <select
            className="input range-select"
            aria-label="Insight date range"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom range</option>
          </select>
        }
      />
      {preset === 'custom' && (
        <div className="custom-range panel">
          <label>
            From
            <input
              className="input"
              type="date"
              max={today}
              value={draftRange.from}
              onChange={(e) =>
                setDraftRange({ ...draftRange, from: e.target.value })
              }
            />
          </label>
          <label>
            To
            <input
              className="input"
              type="date"
              max={today}
              value={draftRange.to}
              onChange={(e) =>
                setDraftRange({ ...draftRange, to: e.target.value })
              }
            />
          </label>
          <Button onClick={applyRange}>Apply range</Button>
          {rangeError && (
            <p className="field-error" role="alert">
              {rangeError}
            </p>
          )}
        </div>
      )}
      <div className="insight-context">
        <span>
          {formatDay(range.from, 'MMM d')} to{' '}
          {formatDay(range.to, 'MMM d, yyyy')}
        </span>
        {data && <span>{data.recordedDayCount} days recorded</span>}
      </div>
      {query.isPending ? (
        <LoadingState label="Finding the patterns in your days..." />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : !data || !summary || data.recordedDayCount === 0 ? (
        <section className="panel">
          <EmptyState
            title="Your patterns start with a check-in"
            description="After a few entries, this is where your daily moments become a bigger picture."
            action={
              <Link className="button button-primary" to="/today">
                Start today's check-in <ArrowRight size={15} />
              </Link>
            }
          />
        </section>
      ) : (
        <>
          <div className="insight-stats">
            {[
              {
                icon: Moon,
                label: 'Average sleep',
                value: sleepLabel(
                  summary.averageSleepMinutes === null
                    ? null
                    : Math.round(summary.averageSleepMinutes),
                ),
                note:
                  user!.goals.sleepHours === null
                    ? 'No sleep target set'
                    : `${rateLabel(summary.sleepGoalRate)} of logged days met your target`,
                tone: 'sage',
              },
              {
                icon: Droplets,
                label: 'Average water',
                value: waterLabel(summary.averageWaterMl),
                note:
                  user!.goals.waterMl === null
                    ? 'No water target set'
                    : `${rateLabel(summary.waterGoalRate)} of logged days met your target`,
                tone: 'blue',
              },
              {
                icon: Heart,
                label: 'Average mood',
                value:
                  summary.averageMood === null
                    ? 'No data'
                    : `${summary.averageMood.toFixed(1)} / 5`,
                note: 'Based on your logged mood entries',
                tone: 'rose',
              },
              {
                icon: CircleCheck,
                label: 'Check-in consistency',
                value: rateLabel(summary.checkInCompletionRate),
                note: `${data.completeDayCount} of ${data.dayCount} days complete`,
                tone: 'gold',
              },
            ].map(({ icon: Icon, label, value, note, tone }) => (
              <section className={`panel insight-stat ${tone}`} key={label}>
                <div>
                  <span>{label}</span>
                  <Icon size={17} />
                </div>
                <strong>{value}</strong>
                <p>{note}</p>
              </section>
            ))}
          </div>
          <div className="insight-charts">
            {[
              {
                title: 'Sleep trends',
                description: 'Hours of rest across your selected days.',
                field: 'sleepMinutes' as const,
                color: '#7a915f',
                label: 'Sleep',
                unit: 'hours',
                map: (v: number) => v / 60,
                fmt: (v: number) => `${v.toFixed(1)} hrs`,
                text: `Average ${sleepLabel(summary.averageSleepMinutes === null ? null : Math.round(summary.averageSleepMinutes))}. ${user!.goals.sleepHours === null ? '' : `Target ${user!.goals.sleepHours} hours.`}`,
              },
              {
                title: 'Hydration trends',
                description: 'Small sips add up.',
                field: 'waterMl' as const,
                color: '#5d908c',
                label: 'Water',
                unit: 'liters',
                map: (v: number) => v / 1000,
                fmt: (v: number) => `${v.toFixed(2)} L`,
                text: `Average ${waterLabel(summary.averageWaterMl)}. ${user!.goals.waterMl === null ? '' : `Target ${waterLabel(user!.goals.waterMl)}.`}`,
              },
              {
                title: 'Mood trends',
                description: 'Your mood on a five-point scale.',
                field: 'mood' as const,
                color: '#a7767c',
                label: 'Mood',
                unit: '1 to 5',
                map: (v: number) => v,
                fmt: (v: number) => `${v} / 5`,
                text:
                  summary.averageMood === null
                    ? 'No moods logged in this range.'
                    : `Average mood ${summary.averageMood.toFixed(1)} of 5 across logged days.`,
              },
              {
                title: 'Daily points earned',
                description: 'Points earned for your daily activity.',
                field: 'pointsEarned' as const,
                color: '#9b814d',
                label: 'Points',
                unit: 'points',
                map: (v: number) => v,
                fmt: (v: number) => `${v} pts`,
                text: `${summary.totalPoints} points earned in this range.`,
              },
            ].map((chart) => (
              <section className="panel chart-panel" key={chart.field}>
                <div className="panel-heading">
                  <div>
                    <h2>{chart.title}</h2>
                  </div>
                  <span className="chart-unit">{chart.unit}</span>
                </div>
                <TrendChart
                  data={data.days.map((day) => ({
                    localDate: day.localDate,
                    value:
                      day[chart.field] === null
                        ? null
                        : chart.map(day[chart.field]!),
                  }))}
                  color={chart.color}
                  valueLabel={chart.label}
                  formatValue={chart.fmt}
                  domain={chart.field === 'mood' ? [1, 5] : undefined}
                />
                <p className="chart-summary">
                  {chart.text}{' '}
                  {chart.field === 'pointsEarned'
                    ? 'Zero means no points earned for that day.'
                    : 'Gaps mean not logged.'}
                </p>
              </section>
            ))}
          </div>
          <div className="insight-bottom">
            <section className="panel panel-pad habit-insights">
              <div className="panel-heading">
                <div>
                  <h2>Your habits</h2>
                  <p className="panel-subtitle">
                    {rateLabel(summary.habitCompletionRate)} of your habits
                    completed.
                  </p>
                </div>
                <LeafMark />
              </div>
              {data.habits.length ? (
                data.habits.map((habit) => (
                  <div className="habit-insight-row" key={habit.habitId}>
                    <div>
                      <span>{habit.name}</span>
                      <strong>{rateLabel(habit.completionRate)}</strong>
                    </div>
                    <Progress
                      value={habit.completionRate ?? 0}
                      label={`${habit.name} completion`}
                    />
                    <p>
                      {habit.completedDays} of {habit.eligibleDays}
                      days
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Make space for a routine"
                  description="Add a habit on the Habits page to track its consistency here."
                />
              )}
              <div className="insight-streaks">
                <span>
                  <Flame size={16} />
                  <strong>{summary.currentStreak} days</strong>Current streak
                </span>
                <span>
                  <Flame size={16} />
                  <strong>{summary.longestStreak} days</strong>Longest streak
                </span>
              </div>
            </section>
            <div className="distribution-stack">
              <Distribution
                title="Alcohol tracking"
                icon={<Wine size={17} />}
                values={data.alcoholDistribution}
                total={data.dayCount}
              />
              <Distribution
                title="Bowel movement tracking"
                icon={<BowelIcon size={17} />}
                values={data.bowelDistribution}
                total={data.dayCount}
              />
            </div>
          </div>
          <p className="insight-footnote">
            Your entries show personal patterns. They don't provide medical
            advice.
          </p>
        </>
      )}
    </>
  );
}
function LeafMark() {
  return <CircleCheck size={19} color="#8a9f77" />;
}
function Distribution({
  title,
  icon,
  values,
  total,
}: {
  title: string;
  icon: React.ReactNode;
  values: Record<string, number>;
  total: number;
}) {
  return (
    <section className="panel distribution-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {icon}
      </div>
      {Object.entries(values).map(([key, value]) => (
        <div className="distribution-row" key={key}>
          <span>{key === 'notLogged' ? 'Not logged' : titleCase(key)}</span>
          <div>
            <i style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
          </div>
          <strong>
            {value}
            <small> days</small>
          </strong>
        </div>
      ))}
    </section>
  );
}
