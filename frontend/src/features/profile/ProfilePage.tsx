import { useQuery } from '@tanstack/react-query';
import { Mail, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react';
import { usersApi } from '../../api/users';
import { queryKeys } from '../../api/queryKeys';
import { type UserDto } from '../../types/contracts';
import { initials } from '../../lib/format';
import { PageHeading } from '../../components/ui/PageHeading';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { TargetFields } from './TargetFields';
import { useProfileAutosave } from './useProfileAutosave';
export function ProfilePage() {
  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => usersApi.me(signal),
  });
  return (
    <>
      <PageHeading
        title="Profile"
        eyebrow=""
        description="Manage your account and personal targets."
      />
      {query.isPending ? (
        <LoadingState label="Loading your profile..." />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <ProfileSettings key={query.data.id} user={query.data} />
      )}
    </>
  );
}
function ProfileSettings({ user }: { user: UserDto }) {
  const { draft, change, status, error, retry } = useProfileAutosave(user);
  return (
    <>
      <div className="autosave-status" aria-live="polite">
        {status === 'saving'
          ? 'Saving changes...'
          : status === 'saved'
            ? 'Changes saved.'
            : status === 'idle'
              ? 'Changes save automatically.'
              : ''}
        {error && (
          <>
            <span role="alert">{error}</span>
            <Button variant="secondary" onClick={retry}>
              Retry save
            </Button>
          </>
        )}
      </div>
      <div className="profile-layout">
        <section className="panel profile-account">
          <div className="profile-identity">
            <span className="avatar profile-avatar">
              {initials(draft.displayName)}
            </span>
            <h2>{draft.displayName || 'Your account'}</h2>
            <p>
              <Mail size={12} />
              {user.email}
            </p>
          </div>
          <div className="form-stack">
            <div className="panel-title">
              <UserRound size={16} />
              <h3>Account details</h3>
            </div>
            <Field label="Display name" id="profile-name">
              <input
                className="input"
                id="profile-name"
                autoComplete="name"
                maxLength={50}
                value={draft.displayName}
                onChange={(e) => change({ displayName: e.target.value })}
              />
            </Field>
            <div className="privacy-setting">
              <h3>Leaderboard participation</h3>
              <label className="switch-label">
                <span>Show me on the leaderboard</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft.leaderboardEnabled}
                  onChange={(e) =>
                    change({ leaderboardEnabled: e.target.checked }, true)
                  }
                />
                <i aria-hidden="true" />
              </label>
              <p>
                Only your display name, points and current streak are shared.
              </p>
            </div>
          </div>
          <div className="profile-private">
            <ShieldCheck size={17} />
            <p>Your wellness entries stay private.</p>
          </div>
        </section>
        <section className="panel panel-pad profile-targets">
          <div className="panel-heading">
            <div>
              <h2>Your targets</h2>
              <p className="panel-subtitle">
                Leave any target blank to track without it.
              </p>
            </div>
            <SlidersHorizontal size={19} />
          </div>
          <TargetFields
            value={draft.goals}
            prefix="goal"
            onChange={(goals) => change({ goals })}
          />
        </section>
      </div>
    </>
  );
}
