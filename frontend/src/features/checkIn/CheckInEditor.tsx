import { BowelIcon } from '../../components/ui/BowelIcon';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Moon,
  Droplets,
  Heart,
  Utensils,
  Wine,
  Plus,
  Minus,
  Check,
  ArrowUpRight,
  Flame,
  Circle,
  Trash2,
  Leaf,
  Star,
  X,
  Smile,
  Frown,
  Meh,
} from 'lucide-react';
import { useUnsavedChanges } from '../../app/unsaved';
import { checkInsApi } from '../../api/checkIns';
import { queryKeys } from '../../api/queryKeys';
import { invalidateWellness } from '../../api/invalidation';
import {
  checkInPatchSchema,
  MAX_SLEEP_HOURS,
  MAX_WATER_ML,
  type CheckInDto,
  type HabitDto,
  type CheckInPatch,
  type UserDto,
} from '../../types/contracts';
import { todayInZone } from '../../lib/dates';
import { titleCase, waterLabel, sleepLabel } from '../../lib/format';
import {
  emptyCheckIn,
  draftFromRecord,
  recordedFields,
  moodOptions,
} from './model';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { Progress } from '../../components/ui/Progress';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/States';
import type { LucideIcon } from 'lucide-react';
function SectionTitle({
  icon: Icon,
  title,
  note,
  value,
}: {
  icon: LucideIcon;
  title: string;
  note: string;
  value?: string;
}) {
  return (
    <div className="tracking-heading">
      <span className="tracking-icon">
        <Icon size={18} strokeWidth={1.6} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{note}</p>
      </div>
      {value && <span className="tracking-value">{value}</span>}
    </div>
  );
}
const qualities = ['poor', 'fair', 'good', 'great'].map((value) => ({
  value: value as NonNullable<CheckInPatch['sleep']>['quality'] & string,
  label: titleCase(value),
}));
const alcoholOptions = ['none', 'light', 'heavy', 'blackout'].map((value) => ({
  value: value as NonNullable<CheckInPatch['alcoholStatus']>,
  label: titleCase(value),
}));
const bowelOptions = ['none', 'uncomfortable', 'normal', 'good'].map(
  (value) => ({
    value: value as NonNullable<CheckInPatch['bowelStatus']>,
    label: titleCase(value),
  }),
);
const awardLabels: Record<string, string> = {
  DAILY_CHECKIN_COMPLETE: 'Daily check-in',
  HABIT_COMPLETE: 'Daily habit',
  ALL_DAILY_HABITS_COMPLETE: 'All daily habits',
  WATER_GOAL_REACHED: 'Water target',
  SLEEP_GOAL_REACHED: 'Sleep target',
  ALCOHOL_STATUS_LOGGED: 'Alcohol logged',
  CHECKIN_STREAK_7: '7-day streak',
  CHECKIN_STREAK_30: '30-day streak',
};
function validationMessage(path: PropertyKey[]) {
  if (path[0] === 'waterMl')
    return 'Water intake must be a whole number from 0 to 10,000 ml.';
  if (path[0] === 'sleep')
    return 'Sleep duration must be between 0 and 24 hours.';
  if (path[0] === 'meals' && path[1] === 'snacks')
    return 'Add a short description for each snack, or remove the empty snack.';
  return 'Please check your entries before saving.';
}
export function CheckInEditor({
  localDate,
  record,
  habits,
  user,
  streak,
}: {
  localDate: string;
  record: CheckInDto | null;
  habits: HabitDto[];
  user: UserDto;
  streak: number;
}) {
  const client = useQueryClient();
  const rows =
    record?.habitCompletions ??
    habits
      .filter(
        (h) =>
          h.active &&
          !h.deletedAt &&
          todayInZone(user.timezone, new Date(h.createdAt)) <= localDate,
      )
      .map((h) => ({
        habitId: h.id,
        habitNameSnapshot: h.name,
        completed: false,
      }));
  const initial = record
    ? draftFromRecord(record)
    : {
        ...emptyCheckIn(),
        habitCompletions: rows.map(({ habitId, completed }) => ({
          habitId,
          completed,
        })),
      };
  const [draft, setDraft] = useState<Required<CheckInPatch>>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const count = recordedFields(draft);
  const percent = (count / 9) * 100;
  const completedHabits = draft.habitCompletions.filter(
    (h) => h.completed,
  ).length;
  useUnsavedChanges('check-in', dirty, pending);

  function update<K extends keyof Required<CheckInPatch>>(
    field: K,
    value: Required<CheckInPatch>[K],
  ) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setError('');
    setSaved(false);
  }
  async function save() {
    setError('');
    const parsed = checkInPatchSchema.safeParse(draft);
    if (!parsed.success) {
      setError(validationMessage(parsed.error.issues[0]?.path ?? []));
      return;
    }
    setPending(true);
    try {
      const result = record
        ? await checkInsApi.update(localDate, parsed.data)
        : await checkInsApi.create({ localDate, ...parsed.data });
      setDraft(draftFromRecord(result));
      client.setQueryData(queryKeys.checkIn(localDate), result);
      setSaved(true);
      await invalidateWellness(client);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'We could not save this day. Try again.',
      );
    } finally {
      setPending(false);
    }
  }
  async function remove() {
    setPending(true);
    setError('');
    try {
      await checkInsApi.remove(localDate);
      client.setQueryData(queryKeys.checkIn(localDate), null);
      setConfirmDelete(false);
      await invalidateWellness(client);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The check-in could not be deleted.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="day-summary">
        <div className="day-progress">
          <span className="day-progress-icon">
            <Leaf size={21} />
          </span>
          <div>
            <div className="progress-label">
              <strong>
                {count === 9
                  ? 'Your daily check-in is complete'
                  : 'A little check-in, a little progress'}
              </strong>
              <span>{count}/9 logged</span>
            </div>
            <Progress value={percent} label="Check-in fields logged" />
          </div>
        </div>
        <div className="summary-stat">
          <Flame size={18} />
          <div>
            <strong>
              {streak}
              <span> days</span>
            </strong>
            <small>Current streak</small>
          </div>
        </div>
        <div className="summary-stat">
          <Star size={18} />
          <div>
            <strong>
              +{record?.pointsEarned ?? 0}
              <span> pts</span>
            </strong>
            <small>
              {localDate === todayInZone(user.timezone)
                ? 'Earned today'
                : 'Earned this day'}
            </small>
          </div>
        </div>
      </div>
      <div className="checkin-layout">
        <form
          className="checkin-form"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          noValidate
        >
          <fieldset className="tracking-grid" disabled={pending}>
            <section className="panel tracking-panel">
              <SectionTitle
                icon={Moon}
                title="Sleep"
                note="How was your rest?"
                value={sleepLabel(draft.sleep.durationMinutes)}
              />
              <div className="sleep-input-row">
                <label htmlFor="sleep-hours">Hours of sleep</label>
                <div className="number-with-unit">
                  <input
                    id="sleep-hours"
                    type="number"
                    min={0}
                    max={MAX_SLEEP_HOURS}
                    step={0.25}
                    value={
                      draft.sleep.durationMinutes === null
                        ? ''
                        : Number((draft.sleep.durationMinutes / 60).toFixed(2))
                    }
                    onChange={(e) =>
                      update('sleep', {
                        ...draft.sleep,
                        durationMinutes:
                          e.target.value === ''
                            ? null
                            : Math.round(
                                Math.min(
                                  MAX_SLEEP_HOURS,
                                  Math.max(0, Number(e.target.value)),
                                ) * 60,
                              ),
                      })
                    }
                    placeholder="0"
                    aria-describedby={
                      user.goals.sleepHours !== null
                        ? 'sleep-target'
                        : undefined
                    }
                  />
                  <span>hrs</span>
                </div>
              </div>
              <div className="tracking-actions">
                <Button
                  variant="secondary"
                  disabled={
                    draft.sleep.durationMinutes === null &&
                    draft.sleep.quality === null
                  }
                  onClick={() =>
                    update('sleep', { durationMinutes: null, quality: null })
                  }
                >
                  <X size={14} />
                  Clear sleep
                </Button>
                {user.goals.sleepHours !== null && (
                  <p id="sleep-target" className="tracking-hint">
                    Your target: {user.goals.sleepHours} hours
                  </p>
                )}
              </div>
              <p className="control-label">Sleep quality</p>
              <Segmented
                label="Sleep quality"
                value={draft.sleep.quality}
                options={qualities}
                onChange={(quality) =>
                  update('sleep', { ...draft.sleep, quality })
                }
              />
            </section>
            <section className="panel tracking-panel">
              <SectionTitle
                icon={Droplets}
                title="Hydration"
                note="One glass at a time."
                value={waterLabel(draft.waterMl)}
              />
              <div className="water-visual" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <span
                    key={i}
                    className={
                      i < Math.min(8, Math.floor((draft.waterMl ?? 0) / 250))
                        ? 'filled'
                        : ''
                    }
                  >
                    <Droplets size={24} strokeWidth={1.4} />
                  </span>
                ))}
              </div>
              <div className="water-input-row">
                <label htmlFor="water-ml" className="sr-only">
                  Water intake in milliliters
                </label>
                <div className="number-with-unit">
                  <input
                    id="water-ml"
                    type="number"
                    min={0}
                    max={MAX_WATER_ML}
                    step={50}
                    value={draft.waterMl ?? ''}
                    onChange={(e) =>
                      update(
                        'waterMl',
                        e.target.value === ''
                          ? null
                          : Math.min(
                              MAX_WATER_ML,
                              Math.max(0, Math.round(Number(e.target.value))),
                            ),
                      )
                    }
                    placeholder="Not logged"
                  />
                  <span>ml</span>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Remove 250 ml"
                  disabled={draft.waterMl === null || draft.waterMl < 250}
                  onClick={() =>
                    update('waterMl', Math.max(0, (draft.waterMl ?? 0) - 250))
                  }
                >
                  <Minus size={15} />
                </button>
                <Button
                  variant="secondary"
                  disabled={(draft.waterMl ?? 0) > MAX_WATER_ML - 250}
                  onClick={() =>
                    update(
                      'waterMl',
                      Math.min(MAX_WATER_ML, (draft.waterMl ?? 0) + 250),
                    )
                  }
                >
                  <Plus size={14} />
                  250 ml
                </Button>
              </div>
              <div className="tracking-actions">
                <Button
                  variant="secondary"
                  disabled={draft.waterMl === null}
                  onClick={() => update('waterMl', null)}
                >
                  <X size={14} />
                  Clear water
                </Button>
              </div>
              {user.goals.waterMl !== null && (
                <div className="water-goal">
                  <Progress
                    value={
                      user.goals.waterMl
                        ? ((draft.waterMl ?? 0) / user.goals.waterMl) * 100
                        : draft.waterMl === null
                          ? 0
                          : 100
                    }
                    label="Water target progress"
                  />
                  <span>Target: {waterLabel(user.goals.waterMl)}</span>
                </div>
              )}
            </section>
            <section className="panel tracking-panel full-width">
              <SectionTitle
                icon={Heart}
                title="Mood"
                note={
                  user.goals.targetMood === null
                    ? 'How are you feeling today?'
                    : `Your target: ${moodOptions.find((m) => m.value === user.goals.targetMood)?.label}`
                }
              />
              <div className="mood-selector" role="group" aria-label="Mood">
                {moodOptions.map(({ value, label }) => {
                  const Icon = value < 3 ? Frown : value === 3 ? Meh : Smile;
                  return (
                    <button
                      type="button"
                      className={draft.mood === value ? 'selected' : ''}
                      key={value}
                      aria-pressed={draft.mood === value}
                      onClick={() =>
                        update('mood', draft.mood === value ? null : value)
                      }
                    >
                      <Icon size={27} strokeWidth={1.4} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="panel tracking-panel full-width">
              <SectionTitle
                icon={Utensils}
                title="Meals"
                note="A simple record of what fueled your day."
                value={`${[draft.meals.breakfast, draft.meals.lunch, draft.meals.dinner].filter((m) => m.status === 'eaten').length + draft.meals.snacks.filter((s) => s.description.trim()).length}${user.goals.mealsPerDay !== null && user.goals.mealsPerDay > 0 ? ` / ${user.goals.mealsPerDay}` : ''} eaten`}
              />
              <div className="meal-list">
                {(['breakfast', 'lunch', 'dinner'] as const).map((key) => {
                  const meal = draft.meals[key];
                  return (
                    <div className="meal-item" key={key}>
                      <div className="meal-item-header">
                        <span className="meal-label">{titleCase(key)}</span>
                        <div
                          className="meal-controls"
                          role="group"
                          aria-label={`${titleCase(key)} status`}
                        >
                          {(['eaten', 'skipped', 'not_logged'] as const).map(
                            (status) => (
                              <button
                                type="button"
                                aria-pressed={meal.status === status}
                                className={
                                  meal.status === status ? 'selected' : ''
                                }
                                key={status}
                                onClick={() =>
                                  update('meals', {
                                    ...draft.meals,
                                    [key]:
                                      status === 'eaten'
                                        ? { status, description: '' }
                                        : { status },
                                  })
                                }
                              >
                                {status === 'not_logged'
                                  ? 'Not logged'
                                  : titleCase(status)}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      {meal.status === 'eaten' && (
                        <input
                          id={`meal-${key}`}
                          className="input meal-description"
                          value={meal.description ?? ''}
                          maxLength={200}
                          aria-label={`${titleCase(key)} description`}
                          placeholder="What did you have?"
                          onChange={(e) =>
                            update('meals', {
                              ...draft.meals,
                              [key]: {
                                status: 'eaten',
                                description: e.target.value,
                              },
                            })
                          }
                        />
                      )}
                    </div>
                  );
                })}
                {draft.meals.snacks.map((snack, index) => (
                  <div className="snack-row" key={index}>
                    <label htmlFor={`snack-${index}`} className="sr-only">
                      Snack {index + 1}
                    </label>
                    <input
                      id={`snack-${index}`}
                      className="input"
                      maxLength={200}
                      placeholder="Describe your snack"
                      value={snack.description}
                      onChange={(e) =>
                        update('meals', {
                          ...draft.meals,
                          snacks: draft.meals.snacks.map((s, i) =>
                            i === index ? { description: e.target.value } : s,
                          ),
                        })
                      }
                    />
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Remove snack ${index + 1}`}
                      onClick={() =>
                        update('meals', {
                          ...draft.meals,
                          snacks: draft.meals.snacks.filter(
                            (_, i) => i !== index,
                          ),
                        })
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  disabled={draft.meals.snacks.length >= 10}
                  onClick={() =>
                    update('meals', {
                      ...draft.meals,
                      snacks: [...draft.meals.snacks, { description: '' }],
                    })
                  }
                >
                  <Plus size={14} />
                  Add a snack
                </Button>
              </div>
            </section>
            <section className="panel tracking-panel">
              <SectionTitle
                icon={Wine}
                title="Alcohol"
                note="Keep a record, without judgment."
              />
              <Segmented
                label="Alcohol status"
                value={draft.alcoholStatus}
                options={alcoholOptions}
                onChange={(value) => update('alcoholStatus', value)}
              />
              <p className="tracking-hint">
                {draft.alcoholStatus === null
                  ? 'Not logged yet.'
                  : `Logged: ${titleCase(draft.alcoholStatus)}. Tap again to clear.`}
              </p>
            </section>
            <section className="panel tracking-panel">
              <SectionTitle
                icon={BowelIcon}
                title="Bowel movement"
                note={
                  user.goals.targetBowelStatus === null
                    ? 'A quick daily check.'
                    : `Your target: ${titleCase(user.goals.targetBowelStatus)}`
                }
              />
              <Segmented
                label="Bowel status"
                value={draft.bowelStatus}
                options={bowelOptions}
                onChange={(value) => update('bowelStatus', value)}
              />
              <p className="tracking-hint">
                {draft.bowelStatus === null
                  ? 'Not logged yet.'
                  : `Logged: ${titleCase(draft.bowelStatus)}. Tap again to clear.`}
              </p>
            </section>
          </fieldset>
          <div className="save-bar">
            <div aria-live="polite">
              {error ? (
                <p className="field-error" role="alert">
                  {error}
                </p>
              ) : (
                <p className="muted">
                  {pending
                    ? 'Saving your check-in...'
                    : dirty
                      ? 'You have unsaved changes.'
                      : saved
                        ? 'Your check-in is saved.'
                        : record
                          ? `Last saved ${new Intl.DateTimeFormat('en', { timeZone: user.timezone, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(record.updatedAt))}`
                          : 'Save whenever you are ready.'}
                </p>
              )}
            </div>
            <Button
              type="submit"
              loading={pending}
              disabled={!!record && !dirty}
            >
              <Check size={16} />
              Save check-in
            </Button>
          </div>
        </form>
        <aside className="day-sidebar">
          <section className="panel habit-checklist">
            <div className="panel-heading">
              <div>
                <h2>Daily habits</h2>
                <p className="panel-subtitle">
                  Small routines. Lasting change.
                </p>
              </div>
              <span className="badge">
                {completedHabits}/{rows.length}
              </span>
            </div>
            {rows.length ? (
              <>
                <div className="habit-progress">
                  <Progress
                    value={
                      rows.length ? (completedHabits / rows.length) * 100 : 0
                    }
                    label="Daily habits completed"
                  />
                </div>
                {rows.map((habit) => {
                  const completed =
                    draft.habitCompletions.find(
                      (h) => h.habitId === habit.habitId,
                    )?.completed ?? false;
                  return (
                    <label
                      key={habit.habitId}
                      className={`habit-check-row ${completed ? 'completed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={completed}
                        disabled={pending}
                        onChange={(e) =>
                          update(
                            'habitCompletions',
                            draft.habitCompletions.map((h) =>
                              h.habitId === habit.habitId
                                ? { ...h, completed: e.target.checked }
                                : h,
                            ),
                          )
                        }
                      />
                      <span className="habit-check-icon">
                        {completed ? <Check size={15} /> : <Circle size={18} />}
                      </span>
                      <span>{habit.habitNameSnapshot}</span>
                    </label>
                  );
                })}
              </>
            ) : (
              <EmptyState
                title="Start a small routine"
                description="Add a daily habit on the Habits page."
              />
            )}
            <Link className="text-link manage-habits" to="/habits">
              Manage habits <ArrowUpRight size={14} />
            </Link>
          </section>
          <section className="panel points-panel">
            <div className="panel-heading">
              <h2>Point activity</h2>
              <Star size={16} />
            </div>
            {record?.pointAwards.length ? (
              <>
                <div className="point-total">
                  +{record.pointsEarned}
                  <span>points this day</span>
                </div>
                {record.pointAwards.map((award) => (
                  <div className="point-row" key={award.instanceKey}>
                    <span>
                      {award.triggerKey === 'HABIT_COMPLETE'
                        ? (record.habitCompletions.find(
                            (h) =>
                              award.instanceKey ===
                              `HABIT_COMPLETE:${h.habitId}`,
                          )?.habitNameSnapshot ?? 'Daily habit')
                        : awardLabels[award.triggerKey]}
                    </span>
                    <strong>+{award.points}</strong>
                  </div>
                ))}
              </>
            ) : (
              <p className="muted">
                Save your check-in to see points earned for your activity.
              </p>
            )}
            <p className="points-footnote">
              Points recognize consistency and logging.
            </p>
          </section>
          {record && (
            <section className="panel delete-day-panel">
              <h2>Delete this day</h2>
              <p>Remove this day's entries and points.</p>
              <Button
                variant="danger"
                disabled={pending}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={17} />
                {localDate === todayInZone(user.timezone)
                  ? "Delete today's entry"
                  : "Delete this day's entry"}
              </Button>
            </section>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this check-in?"
        description="This day's wellness entries and points will be removed. This cannot be undone."
        onConfirm={() => void remove()}
        pending={pending}
        error={error || undefined}
        label="Delete check-in"
      />
    </>
  );
}
