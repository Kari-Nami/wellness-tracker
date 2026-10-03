import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserRound,
  Check,
  SlidersHorizontal,
  ShieldCheck,
  LogOut,
  Globe,
  Mail,
} from 'lucide-react';
import { useUnsaved, useUnsavedChanges } from '../../app/unsaved';
import { usersApi } from '../../api/users';
import { queryKeys } from '../../api/queryKeys';
import { useAuth } from '../auth/context';
import {
  profilePatchSchema,
  goalsSchema,
  moodSchema,
  bowelStatusSchema,
  type UserDto,
  type ProfilePatch,
  type Goals,
} from '../../types/contracts';
import { initials, titleCase } from '../../lib/format';
import { PageHeading } from '../../components/ui/PageHeading';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { HabitManager } from '../habits/HabitManager';
function useProfileSave() {
  const client = useQueryClient();
  return async (patch: ProfilePatch) => {
    const user = await usersApi.update(patch);
    client.setQueryData(queryKeys.profile, user);
    client.setQueryData(queryKeys.auth, user);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['insights'] }),
      client.invalidateQueries({ queryKey: queryKeys.leaderboard }),
    ]);
    return user;
  };
}
export function ProfilePage() {
  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => usersApi.me(signal),
  });
  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title="A little more you."
        description="Your preferences, your targets, and the routines that matter to you."
      />
      {query.isPending ? (
        <LoadingState label="Opening your profile..." />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <div className="profile-layout">
          <AccountForm user={query.data} />
          <div className="profile-main">
            <GoalsForm user={query.data} />
            <HabitManager />
          </div>
        </div>
      )}
    </>
  );
}
function AccountForm({ user }: { user: UserDto }) {
  const save = useProfileSave();
  const unsaved = useUnsaved();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const auth = useAuth();
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [logoutPending, setLogoutPending] = useState(false);
  const form = useForm<ProfilePatch>({
    resolver: zodResolver(profilePatchSchema),
    defaultValues: {
      displayName: user.displayName,
      timezone: user.timezone,
      leaderboardEnabled: user.leaderboardEnabled,
    },
  });
  useUnsavedChanges(
    'profile-account',
    form.formState.isDirty,
    form.formState.isSubmitting,
  );
  const timezoneOptions =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : ['UTC', 'Asia/Bangkok', 'America/New_York', 'Europe/London'];
  async function submit(input: ProfilePatch) {
    setError('');
    setFeedback('');
    try {
      const result = await save(input);
      form.reset({
        displayName: result.displayName,
        timezone: result.timezone,
        leaderboardEnabled: result.leaderboardEnabled,
      });
      setFeedback('Your profile is saved.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'We could not update your profile.',
      );
    }
  }
  async function logout() {
    setError('');
    setLogoutPending(true);
    try {
      await auth.logout();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not sign you out.',
      );
    } finally {
      setLogoutPending(false);
    }
  }
  return (
    <section className="panel profile-account">
      <div className="profile-identity">
        <span className="avatar profile-avatar">
          {initials(user.displayName)}
        </span>
        <h2>{user.displayName}</h2>
        <p>
          <Mail size={12} />
          {user.email}
        </p>
        <span className="badge">Your personal wellness space</span>
      </div>
      <form
        className="form-stack"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="panel-title">
          <UserRound size={16} />
          <h3>Account details</h3>
        </div>
        <Field
          label="Display name"
          id="profile-name"
          error={form.formState.errors.displayName?.message}
        >
          <input
            className="input"
            id="profile-name"
            maxLength={50}
            autoComplete="name"
            {...form.register('displayName')}
            aria-describedby="profile-name-help"
            aria-invalid={!!form.formState.errors.displayName}
          />
        </Field>
        <Field
          label="Timezone"
          id="profile-timezone"
          error={form.formState.errors.timezone?.message}
          hint="Daily records follow your timezone."
        >
          <div className="timezone-field">
            <Globe size={15} />
            <input
              className="input"
              id="profile-timezone"
              list="timezone-options"
              {...form.register('timezone')}
              aria-describedby="profile-timezone-help"
              aria-invalid={!!form.formState.errors.timezone}
            />
          </div>
          <datalist id="timezone-options">
            {timezoneOptions.map((zone) => (
              <option value={zone} key={zone} />
            ))}
          </datalist>
        </Field>
        <div className="privacy-setting">
          <div>
            <h3>Leaderboard participation</h3>
            <label className="switch-label">
              <span>Show me on the leaderboard</span>
              <input
                type="checkbox"
                role="switch"
                {...form.register('leaderboardEnabled')}
              />
              <i aria-hidden="true" />
            </label>
          </div>
          <p>Only your display name, points, and current streak are shared.</p>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {feedback && (
          <p className="form-success" role="status">
            {feedback}
          </p>
        )}
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          disabled={!form.formState.isDirty}
        >
          <Check size={15} />
          Save profile
        </Button>
      </form>
      <div className="profile-private">
        <ShieldCheck size={17} />
        <p>Sleep, mood, meals, and your other wellness entries stay private.</p>
      </div>
      <Button
        className="logout-button"
        variant="ghost"
        loading={logoutPending}
        onClick={() => (unsaved.dirty ? setConfirmLogout(true) : void logout())}
      >
        <LogOut size={14} />
        Sign out
      </Button>
      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Sign out without saving?"
        description="Your unsaved profile changes will be discarded when you sign out."
        label="Sign out"
        pending={logoutPending || unsaved.busy}
        onConfirm={() => {
          setConfirmLogout(false);
          void logout();
        }}
      />
    </section>
  );
}
function GoalsForm({ user }: { user: UserDto }) {
  const save = useProfileSave();
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const form = useForm<Goals>({
    resolver: zodResolver(goalsSchema),
    defaultValues: user.goals,
  });
  useUnsavedChanges(
    'profile-goals',
    form.formState.isDirty,
    form.formState.isSubmitting,
  );
  const errors = form.formState.errors;
  async function submit(goals: Goals) {
    setError('');
    setFeedback('');
    try {
      const result = await save({ goals });
      form.reset(result.goals);
      setFeedback('Your targets are saved.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not save your targets.',
      );
    }
  }
  return (
    <section className="panel panel-pad">
      <div className="panel-heading">
        <div>
          <h2>Your wellness targets</h2>
          <p className="panel-subtitle">
            Choose what feels right for your routine.
          </p>
        </div>
        <SlidersHorizontal size={19} color="#8da379" />
      </div>
      <form
        className="form-stack"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="form-grid">
          <Field
            label="Sleep target (hours)"
            id="goal-sleep"
            error={errors.sleepHours?.message}
          >
            <input
              className="input"
              type="number"
              min={0}
              max={24}
              step={0.25}
              id="goal-sleep"
              {...form.register('sleepHours', { valueAsNumber: true })}
              aria-describedby="goal-sleep-help"
              aria-invalid={!!errors.sleepHours}
            />
          </Field>
          <Field
            label="Water target (liters)"
            id="goal-water"
            error={errors.waterMl?.message}
          >
            <Controller
              name="waterMl"
              control={form.control}
              render={({ field }) => (
                <input
                  className="input"
                  id="goal-water"
                  type="number"
                  min={0}
                  max={10}
                  step={0.05}
                  value={Number.isNaN(field.value) ? '' : field.value / 1000}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ''
                        ? NaN
                        : Math.round(Number(e.target.value) * 1000),
                    )
                  }
                  aria-describedby="goal-water-help"
                  aria-invalid={!!errors.waterMl}
                />
              )}
            />
          </Field>
          <Field
            label="Meals per day"
            id="goal-meals"
            error={errors.mealsPerDay?.message}
            hint="Main meals and snacks can count toward your target."
          >
            <input
              className="input"
              type="number"
              min={0}
              max={10}
              step={1}
              id="goal-meals"
              {...form.register('mealsPerDay', { valueAsNumber: true })}
              aria-describedby="goal-meals-help"
              aria-invalid={!!errors.mealsPerDay}
            />
          </Field>
          <Field label="Mood target (optional)" id="goal-mood">
            <Controller
              name="targetMood"
              control={form.control}
              render={({ field }) => (
                <select
                  className="input"
                  id="goal-mood"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ''
                        ? null
                        : moodSchema.parse(Number(e.target.value)),
                    )
                  }
                >
                  <option value="">No target</option>
                  {['Very bad', 'Bad', 'Okay', 'Good', 'Great'].map(
                    (label, i) => (
                      <option value={i + 1} key={label}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              )}
            />
          </Field>
          <Field label="Bowel movement target (optional)" id="goal-bowel">
            <Controller
              name="targetBowelStatus"
              control={form.control}
              render={({ field }) => (
                <select
                  className="input"
                  id="goal-bowel"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ''
                        ? null
                        : bowelStatusSchema.parse(e.target.value),
                    )
                  }
                >
                  <option value="">No target</option>
                  {bowelStatusSchema.options.map((value) => (
                    <option value={value} key={value}>
                      {titleCase(value)}
                    </option>
                  ))}
                </select>
              )}
            />
          </Field>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {feedback && (
          <p className="form-success" role="status">
            {feedback}
          </p>
        )}
        <div className="goal-form-footer">
          <p>These are personal targets, not medical recommendations.</p>
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={!form.formState.isDirty}
          >
            <Check size={15} />
            Save targets
          </Button>
        </div>
      </form>
    </section>
  );
}
