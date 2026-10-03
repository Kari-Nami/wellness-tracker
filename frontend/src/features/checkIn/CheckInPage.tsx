import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { checkInsApi } from '../../api/checkIns';
import { habitsApi } from '../../api/habits';
import { insightsApi } from '../../api/insights';
import { ApiError } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { useAuth } from '../auth/context';
import { useToday } from '../../hooks/useToday';
import { shiftDate, formatDay } from '../../lib/dates';
import { localDateSchema } from '../../types/contracts';
import { PageHeading } from '../../components/ui/PageHeading';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useUnsaved } from '../../app/unsaved';
import { Button } from '../../components/ui/Button';
import { CheckInEditor } from './CheckInEditor';
export function CheckInPage({ localDate }: { localDate?: string }) {
  const { user } = useAuth();
  const today = useToday(user!.timezone);
  const [workingDate, setWorkingDate] = useState(today);
  const unsaved = useUnsaved();
  const date = localDate ?? workingDate;
  if (!localDateSchema.safeParse(date).success || date > today)
    return (
      <ErrorState error={new Error('Choose a valid date today or earlier.')} />
    );
  return (
    <>
      {!localDate && date !== today && (
        <div className="form-success day-rollover" role="status">
          <p>
            A new day has started. Finish saving this day before opening today's
            check-in.
          </p>
          <Button
            variant="secondary"
            disabled={unsaved.dirty || unsaved.busy}
            onClick={() => setWorkingDate(today)}
          >
            Open today's check-in
          </Button>
        </div>
      )}
      <DateRecord key={date} date={date} today={today} />
    </>
  );
}
function DateRecord({ date, today }: { date: string; today: string }) {
  const { user } = useAuth();
  const checkIn = useQuery({
    queryKey: queryKeys.checkIn(date),
    queryFn: async ({ signal }) => {
      try {
        return await checkInsApi.get(date, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });
  const habits = useQuery({
    queryKey: queryKeys.habits(),
    queryFn: ({ signal }) => habitsApi.list(false, signal),
  });
  const insights = useQuery({
    queryKey: queryKeys.insights(shiftDate(today, -6), today),
    queryFn: ({ signal }) =>
      insightsApi.get({ from: shiftDate(today, -6), to: today }, signal),
  });
  const hour = Number(
    new Intl.DateTimeFormat('en', {
      timeZone: user!.timezone,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(new Date()),
  );
  return (
    <>
      {date !== today && (
        <Link className="text-link history-back" to="/calendar">
          <ArrowLeft size={14} />
          Back to calendar
        </Link>
      )}
      <PageHeading
        eyebrow={
          date === today ? 'YOUR DAILY CHECK-IN' : 'A MOMENT IN YOUR HISTORY'
        }
        title={
          date === today
            ? `Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, ${user!.displayName.split(' ')[0]}.`
            : formatDay(date, 'MMMM d, yyyy')
        }
        description={
          date === today
            ? 'Make a little time for yourself today.'
            : 'Revisit your day, fill in a gap, or make a correction.'
        }
        action={
          <span className="date-chip">
            <CalendarDays size={15} />
            {formatDay(date, 'EEE, MMM d')}
          </span>
        }
      />
      {checkIn.isPending || habits.isPending ? (
        <LoadingState />
      ) : checkIn.error || habits.error ? (
        <ErrorState
          error={(checkIn.error || habits.error)!}
          retry={() => {
            void checkIn.refetch();
            void habits.refetch();
          }}
        />
      ) : (
        <CheckInEditor
          key={`${date}:${checkIn.data?.id ?? 'new'}`}
          localDate={date}
          record={checkIn.data ?? null}
          habits={habits.data ?? []}
          user={user!}
          streak={
            insights.data?.summary.currentStreak ??
            checkIn.data?.currentStreak ??
            0
          }
        />
      )}
    </>
  );
}
