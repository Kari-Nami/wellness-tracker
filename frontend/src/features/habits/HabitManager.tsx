import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Leaf, Plus, Pencil, Trash2, Pause, Play } from 'lucide-react';
import { habitsApi } from '../../api/habits';
import { queryKeys } from '../../api/queryKeys';
import { invalidateWellness } from '../../api/invalidation';
import {
  habitInputSchema,
  type HabitInput,
  type HabitDto,
} from '../../types/contracts';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '../../components/ui/States';
export function HabitManager() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.habits(),
    queryFn: ({ signal }) => habitsApi.list(signal),
  });
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<HabitDto | null>(null);
  const [deleting, setDeleting] = useState<HabitDto | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const habits = query.data ?? [];
  const active = habits.filter((h) => h.active).length;
  async function changed() {
    await client.invalidateQueries({ queryKey: ['habits'] });
    await invalidateWellness(client);
  }
  async function toggle(habit: HabitDto) {
    setPending(habit.id);
    setError('');
    try {
      await habitsApi.update(habit.id, { active: !habit.active });
      await changed();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not update this habit.',
      );
    } finally {
      setPending(null);
    }
  }
  async function remove() {
    if (!deleting) return;
    setPending(deleting.id);
    setError('');
    try {
      await habitsApi.remove(deleting.id);
      setDeleting(null);
      await changed();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not delete this habit.',
      );
    } finally {
      setPending(null);
    }
  }
  const add = () => {
    setEditing(null);
    setDialog(true);
  };
  return (
    <section className="panel panel-pad" id="habits">
      <div className="panel-heading">
        <div>
          <h2>Your daily habits</h2>
          <p className="panel-subtitle">
            {active} active {active === 1 ? 'habit' : 'habits'}.
          </p>
        </div>
        <Button variant="secondary" disabled={!!pending} onClick={add}>
          <Plus size={14} />
          Add habit
        </Button>
      </div>
      {query.isPending ? (
        <LoadingState label="Loading your routines..." />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : !habits.length ? (
        <EmptyState
          title="Start with one small habit"
          description="A walk, a few pages, a moment of quiet. Choose a routine you want to return to each day."
          action={
            <Button onClick={add}>
              <Plus size={14} />
              Create your first habit
            </Button>
          }
        />
      ) : (
        <div className="managed-habits">
          {habits.map((habit) => (
            <div
              className={`managed-habit ${habit.active ? '' : 'paused'}`}
              key={habit.id}
            >
              <span className="habit-leaf">
                <Leaf size={17} />
              </span>
              <div className="habit-information">
                <h3>{habit.name}</h3>
                {habit.description && <p>{habit.description}</p>}
                <span
                  className={`badge ${habit.active ? '' : 'badge-neutral'}`}
                >
                  {habit.active ? 'Every day' : 'Paused'}
                </span>
              </div>
              <div className="habit-row-actions">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Edit ${habit.name}`}
                  disabled={!!pending}
                  onClick={() => {
                    setEditing(habit);
                    setDialog(true);
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`${habit.active ? 'Pause' : 'Resume'} ${habit.name}`}
                  disabled={!!pending}
                  onClick={() => void toggle(habit)}
                >
                  {habit.active ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Delete ${habit.name}`}
                  disabled={!!pending}
                  onClick={() => {
                    setError('');
                    setDeleting(habit);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && !deleting && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="habit-management-note">
        Pause a habit to keep it for later. Deleting removes it permanently;
        past check-ins stay intact.
      </p>
      <Modal
        open={dialog}
        onOpenChange={setDialog}
        title={editing ? 'Make this habit yours' : 'One small daily habit'}
        description="Choose a simple routine you can return to every day."
      >
        <HabitForm
          key={editing?.id ?? 'new'}
          habit={editing}
          onSaved={async () => {
            setDialog(false);
            await changed();
          }}
        />
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete this habit?"
        description={`“${deleting?.name ?? ''}” will be permanently deleted and cannot be restored. Its past check-in history will remain.`}
        onConfirm={() => void remove()}
        pending={!!pending}
        error={error || undefined}
        label="Delete habit"
      />
    </section>
  );
}
function HabitForm({
  habit,
  onSaved,
}: {
  habit: HabitDto | null;
  onSaved: () => Promise<void>;
}) {
  const [error, setError] = useState('');
  const form = useForm<HabitInput>({
    resolver: zodResolver(habitInputSchema),
    defaultValues: {
      name: habit?.name ?? '',
      description: habit?.description ?? '',
      active: habit?.active ?? true,
    },
  });
  async function submit(input: HabitInput) {
    setError('');
    try {
      if (habit) await habitsApi.update(habit.id, input);
      else await habitsApi.create(input);
      await onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not save this habit.',
      );
    }
  }
  return (
    <form
      className="form-stack"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <Field
        id="habit-name"
        label="Habit name"
        error={form.formState.errors.name?.message}
      >
        <input
          className="input"
          id="habit-name"
          placeholder="e.g. Take a 20-minute walk"
          maxLength={80}
          {...form.register('name')}
          aria-invalid={!!form.formState.errors.name}
          aria-describedby="habit-name-help"
        />
      </Field>
      <Field
        id="habit-description"
        label="Description"
        error={form.formState.errors.description?.message}
      >
        <textarea
          className="input"
          id="habit-description"
          rows={3}
          maxLength={200}
          placeholder="What does this habit look like for you?"
          {...form.register('description')}
          aria-describedby="habit-description-help"
        />
      </Field>
      <label className="check-label">
        <input type="checkbox" {...form.register('active')} />
        Active every day
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={form.formState.isSubmitting}>
        {habit ? 'Save changes' : 'Create habit'}
      </Button>
    </form>
  );
}
