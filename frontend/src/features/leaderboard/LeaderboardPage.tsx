import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Flame, Star, ShieldCheck, ArrowRight } from 'lucide-react';
import { leaderboardApi } from '../../api/leaderboard';
import { queryKeys } from '../../api/queryKeys';
import { useAuth } from '../auth/context';
import { initials } from '../../lib/format';
import { PageHeading } from '../../components/ui/PageHeading';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '../../components/ui/States';
export function LeaderboardPage() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: ({ signal }) => leaderboardApi.list(signal),
  });
  const rows = query.data ?? [];
  return (
    <>
      <PageHeading
        eyebrow="CONSISTENCY TOGETHER"
        title="Leaderboard"
        description="Compare all-time points and current streaks."
        action={
          <span className="date-chip">
            <Trophy size={13} />
            All-time points
          </span>
        }
      />
      {!user!.leaderboardEnabled && (
        <div className="leaderboard-optout">
          <ShieldCheck size={18} />
          <p>
            You're keeping your place private. You can still enjoy the board.
          </p>
          <Link className="text-link" to="/profile">
            Change preference <ArrowRight size={13} />
          </Link>
        </div>
      )}
      {query.isPending ? (
        <LoadingState label="Loading the community board..." />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : !rows.length ? (
        <section className="panel">
          <EmptyState
            title="A fresh start for the board"
            description="Participants will appear here as they join. Keep checking in at your own pace."
            action={
              <Link className="button button-primary" to="/today">
                Back to your day <ArrowRight size={14} />
              </Link>
            }
          />
        </section>
      ) : (
        <>
          <div className="leaderboard-layout">
            <section className="panel leaderboard-table">
              <div className="panel-heading">
                <div>
                  <h2>The community board</h2>
                  <p className="panel-subtitle">
                    {rows.length} people, making time for themselves.
                  </p>
                </div>
                <Star size={18} />
              </div>
              <table>
                <caption className="sr-only">
                  All-time points leaderboard
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Member</th>
                    <th scope="col">Points</th>
                    <th scope="col">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      className={
                        row.isCurrentUser ? 'current-user-row' : undefined
                      }
                      key={row.rank}
                    >
                      <td>
                        <span className={`rank-number rank-${row.rank}`}>
                          {row.rank}
                        </span>
                      </td>
                      <td>
                        <div className="leader-name">
                          <span className="avatar">
                            {initials(row.displayName)}
                          </span>
                          <span>{row.displayName}</span>
                          {row.isCurrentUser && (
                            <span className="badge">You</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{row.points.toLocaleString()}</strong>
                        <span className="table-unit"> pts</span>
                      </td>
                      <td>
                        <span className="streak-cell">
                          <Flame size={12} />
                          {row.currentStreak}
                          <span className="table-unit">
                            {row.currentStreak === 1 ? ' day' : ' days'}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
          <p className="leaderboard-footnote">
            Points celebrate logging and consistency. This is a little
            encouragement, not a measure of health.
          </p>
        </>
      )}
    </>
  );
}
