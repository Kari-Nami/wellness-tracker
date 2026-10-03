import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Flame, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
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
  const own = rows.find((r) => r.isCurrentUser);
  return (
    <>
      <PageHeading
        eyebrow="CONSISTENCY, TOGETHER"
        title="Small steps add up."
        description="A little shared motivation for showing up, day after day."
        action={
          <span className="badge badge-neutral">
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
          <div className="leaderboard-highlights">
            {rows.slice(0, 3).map((row) => (
              <section
                className={`panel leader-highlight place-${row.rank} ${row.isCurrentUser ? 'highlight-own' : ''}`}
                key={row.rank}
              >
                <div className="leader-highlight-top">
                  <span className="leader-place">
                    <Trophy size={13} />
                    {row.rank === 1
                      ? 'Leading the way'
                      : row.rank === 2
                        ? 'Building momentum'
                        : 'Showing up'}
                  </span>
                  <span>#{row.rank}</span>
                </div>
                <div className="leader-highlight-person">
                  <span className="avatar">{initials(row.displayName)}</span>
                  <div>
                    <h2>
                      {row.displayName}
                      {row.isCurrentUser && <span className="badge">You</span>}
                    </h2>
                    <p>
                      <Flame size={12} />
                      {row.currentStreak}-day streak
                    </p>
                  </div>
                </div>
                <strong>
                  {row.points.toLocaleString()}
                  <span>points</span>
                </strong>
              </section>
            ))}
          </div>
          <div className="leaderboard-layout">
            <section className="panel leaderboard-table">
              <div className="panel-heading">
                <div>
                  <h2>The community board</h2>
                  <p className="panel-subtitle">
                    {rows.length} people, making time for themselves.
                  </p>
                </div>
                <Sparkles size={18} />
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
                      className={row.isCurrentUser ? 'current-user-row' : ''}
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
                          <span className="table-unit"> days</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <aside className="leaderboard-sidebar">
              {own && (
                <section className="panel your-place">
                  <p className="eyebrow">YOUR LITTLE MOMENTUM</p>
                  <div className="your-rank">
                    #{own.rank}
                    <span>Your current place</span>
                  </div>
                  <div className="your-place-details">
                    <span>
                      <strong>{own.points.toLocaleString()}</strong>All-time
                      points
                    </span>
                    <span>
                      <strong>{own.currentStreak}</strong>Day streak
                    </span>
                  </div>
                  <Link className="button button-primary" to="/today">
                    Keep showing up <ArrowRight size={14} />
                  </Link>
                </section>
              )}
              <section className="leaderboard-privacy">
                <ShieldCheck size={25} />
                <h3>
                  A little motivation.
                  <br />
                  Your privacy, always.
                </h3>
                <p>
                  The board shares display names, points, and streaks. Your
                  personal wellness entries stay with you.
                </p>
                <Link className="text-link" to="/profile">
                  Your preferences <ArrowRight size={13} />
                </Link>
              </section>
            </aside>
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
