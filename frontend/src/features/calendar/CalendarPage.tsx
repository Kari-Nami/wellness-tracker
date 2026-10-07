import { BowelIcon } from '../../components/ui/BowelIcon';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DayPicker } from 'react-day-picker';
import { startOfMonth, startOfWeek, addDays, format } from 'date-fns';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ArrowRight,
  Check,
  Circle,
  Moon,
  Droplets,
  Heart,
  Utensils,
  Wine,
  Star,
} from 'lucide-react';
import { checkInsApi } from '../../api/checkIns';
import { queryKeys } from '../../api/queryKeys';
import { ApiError } from '../../api/client';
import { useAuth } from '../auth/context';
import { useToday } from '../../hooks/useToday';
import { dateKey, dateFromKey, formatDay } from '../../lib/dates';
import { sleepLabel, waterLabel, titleCase } from '../../lib/format';
import { localDateSchema } from '../../types/contracts';
import { CheckInPage } from '../checkIn/CheckInPage';
import { moodOptions } from '../checkIn/model';
import { PageHeading } from '../../components/ui/PageHeading';
import {
  ErrorState,
  LoadingState,
  EmptyState,
} from '../../components/ui/States';
import { Progress } from '../../components/ui/Progress';
import 'react-day-picker/style.css';
export function HistoricalCheckInPage() {
  const { localDate } = useParams();
  return <CheckInPage localDate={localDate} />;
}
export function CalendarPage() {
  const { user } = useAuth();
  const today = useToday(user!.timezone);
  const [params, setParams] = useSearchParams();
  const requested = params.get('date');
  const selected =
    requested &&
    localDateSchema.safeParse(requested).success &&
    requested <= today
      ? requested
      : today;
  const [month, setMonth] = useState(() => startOfMonth(dateFromKey(selected)));
  const firstVisibleDay = startOfWeek(startOfMonth(month));
  const from = dateKey(firstVisibleDay);
  const to = dateKey(addDays(firstVisibleDay, 41));
  const query = useQuery({
    queryKey: queryKeys.checkIns(from, to, 'summary'),
    queryFn: ({ signal }) => checkInsApi.summaries({ from, to }, signal),
  });
  const records = query.data ?? [];
  const inMonth = records.filter((r) =>
    r.localDate.startsWith(format(month, 'yyyy-MM')),
  );
  const complete = inMonth.filter((r) => r.completion === 'complete').length;
  const partial = inMonth.filter(
    (r) => r.completion === 'partial' && r.completedFieldCount > 0,
  ).length;
  function choose(day: Date | undefined) {
    if (!day) return;
    setParams({ date: dateKey(day) });
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR WELLNESS OVER TIME"
        title="Calendar"
        description="Select a date to view or edit your check-in."
        action={
          <Link className="button button-secondary" to="/today">
            Today's check-in <ArrowRight size={14} />
          </Link>
        }
      />
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="panel-heading">
            <div>
              <h2>Your calendar</h2>
              <p className="panel-subtitle">
                Choose a day to take a closer look.
              </p>
            </div>
            <CalendarDays size={19} />
          </div>
          {query.isPending ? (
            <LoadingState label="Loading your calendar..." />
          ) : query.error ? (
            <ErrorState
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : (
            <>
              <DayPicker
                mode="single"
                required
                month={month}
                onMonthChange={setMonth}
                selected={dateFromKey(selected)}
                onSelect={choose}
                showOutsideDays
                fixedWeeks
                disabled={{ after: dateFromKey(today) }}
                endMonth={dateFromKey(today)}
                modifiers={{
                  complete: records
                    .filter((r) => r.completion === 'complete')
                    .map((r) => dateFromKey(r.localDate)),
                  partial: records
                    .filter(
                      (r) =>
                        r.completion === 'partial' && r.completedFieldCount > 0,
                    )
                    .map((r) => dateFromKey(r.localDate)),
                  missing: (day) =>
                    dateKey(day) <= today &&
                    !records.some(
                      (r) =>
                        r.localDate === dateKey(day) &&
                        r.completedFieldCount > 0,
                    ),
                }}
                modifiersClassNames={{
                  complete: 'cal-complete',
                  partial: 'cal-partial',
                  missing: 'cal-missing',
                }}
                labels={{
                  labelDayButton: (day, modifiers) =>
                    `${format(day, 'MMMM d, yyyy')}, ${modifiers.complete ? 'complete' : modifiers.partial ? 'partial' : modifiers.disabled ? 'future date' : 'not logged'}`,
                }}
              />
              <div className="calendar-legend">
                <span>
                  <i className="legend-complete" />
                  Complete
                </span>
                <span>
                  <i className="legend-partial" />
                  Partial
                </span>
                <span>
                  <i className="legend-missing" />
                  Not logged
                </span>
              </div>
            </>
          )}
          <div className="month-summary">
            <div>
              <strong>{complete}</strong>
              <span>Complete days</span>
            </div>
            <div>
              <strong>{partial}</strong>
              <span>Partial days</span>
            </div>
            <div>
              <strong>{inMonth.reduce((n, r) => n + r.pointsEarned, 0)}</strong>
              <span>Points this month</span>
            </div>
          </div>
        </section>
        <SelectedDay date={selected} />
      </div>
    </>
  );
}
function SelectedDay({ date }: { date: string }) {
  const query = useQuery({
    queryKey: queryKeys.checkIn(date),
    queryFn: async ({ signal }) => {
      try {
        return await checkInsApi.get(date, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
  const record = query.data;
  return (
    <section className="panel selected-day">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SELECTED DAY</p>
          <h2>{formatDay(date, 'EEEE, MMMM d')}</h2>
        </div>
        {record && (
          <span
            className={`badge ${record.completion === 'partial' ? 'badge-amber' : ''}`}
          >
            {record.completion === 'complete' ? (
              <Check size={12} />
            ) : (
              <Circle size={12} />
            )}
            {record.completedFieldCount === 0
              ? 'Not logged'
              : titleCase(record.completion)}
          </span>
        )}
      </div>
      {query.isPending ? (
        <LoadingState label="Opening this day..." />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : !record ? (
        <EmptyState
          title="A fresh page for this day"
          description="There is no check-in yet. Add what you remember, even if it's only a little."
          action={
            <Link className="button button-primary" to={`/calendar/${date}`}>
              Add check-in <ArrowRight size={14} />
            </Link>
          }
        />
      ) : (
        <>
          <div className="selected-progress">
            <span>{record.completedFieldCount} of 9 fields logged</span>
            <Progress
              value={(record.completedFieldCount / 9) * 100}
              label="Selected day completeness"
            />
          </div>
          <div className="day-detail-list">
            {[
              {
                icon: Moon,
                label: 'Sleep',
                value: sleepLabel(record.sleep.durationMinutes),
              },
              {
                icon: Droplets,
                label: 'Water',
                value: waterLabel(record.waterMl),
              },
              {
                icon: Heart,
                label: 'Mood',
                value:
                  moodOptions.find((m) => m.value === record.mood)?.label ??
                  'Not logged',
              },
              {
                icon: Utensils,
                label: 'Meals',
                value: `${[record.meals.breakfast, record.meals.lunch, record.meals.dinner].filter((m) => m.status !== 'not_logged').length} of 3 logged`,
              },
              {
                icon: Wine,
                label: 'Alcohol',
                value: record.alcoholStatus
                  ? titleCase(record.alcoholStatus)
                  : 'Not logged',
              },
              {
                icon: BowelIcon,
                label: 'Bowel movement',
                value: record.bowelStatus
                  ? titleCase(record.bowelStatus)
                  : 'Not logged',
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <span>
                  <Icon size={16} />
                  {label}
                </span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="selected-habits">
            <h3>Daily habits</h3>
            {record.habitCompletions.length ? (
              record.habitCompletions.map((habit) => (
                <p key={habit.habitId}>
                  {habit.completed ? <Check size={14} /> : <Circle size={14} />}
                  {habit.habitNameSnapshot}
                  <span>{habit.completed ? 'Done' : 'Not completed'}</span>
                </p>
              ))
            ) : (
              <p className="muted">No habits for this day.</p>
            )}
          </div>
          <div className="selected-points">
            <Star size={16} />
            <strong>+{record.pointsEarned} points</strong>
            <span>Earned this day</span>
          </div>
          <Link
            className="button button-primary edit-day"
            to={`/calendar/${date}`}
          >
            Edit check-in <ArrowRight size={14} />
          </Link>
        </>
      )}
    </section>
  );
}
