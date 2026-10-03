import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { queryKeys } from '../../api/queryKeys';
import {
  pointRuleInputSchema,
  type PointRuleInput,
  type PointRuleDto,
  type PointTriggerDto,
} from '../../types/contracts';
import { PageHeading } from '../../components/ui/PageHeading';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '../../components/ui/States';
export function AdminPage() {
  const client = useQueryClient();
  const rules = useQuery({
    queryKey: queryKeys.pointRules,
    queryFn: ({ signal }) => adminApi.rules(signal),
  });
  const triggers = useQuery({
    queryKey: queryKeys.pointTriggers,
    queryFn: ({ signal }) => adminApi.triggers(signal),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PointRuleDto | null>(null);
  const [deleting, setDeleting] = useState<PointRuleDto | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const available = (triggers.data ?? []).filter(
    (t) => !rules.data?.some((r) => r.triggerKey === t.key),
  );
  const loading = rules.isPending || triggers.isPending;
  async function changed(message: string) {
    await client.invalidateQueries({ queryKey: queryKeys.pointRules });
    setFeedback(message);
  }
  async function toggle(rule: PointRuleDto) {
    setPending(rule.id);
    setError('');
    setFeedback('');
    try {
      await adminApi.update(rule.id, { enabled: !rule.enabled });
      await changed(
        rule.enabled
          ? 'Rule disabled. Existing awards are unchanged.'
          : 'Rule enabled for future qualifying activity.',
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not update this rule.',
      );
    } finally {
      setPending(null);
    }
  }
  async function remove() {
    if (!deleting) return;
    setPending(deleting.id);
    setError('');
    setFeedback('');
    try {
      await adminApi.remove(deleting.id);
      setDeleting(null);
      await changed('Rule deleted. Historical awards are unchanged.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not delete this rule.',
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="A little recognition, thoughtfully set."
        description="Manage global point values for supported tracking activities."
        action={
          <Button
            disabled={
              loading ||
              !!rules.error ||
              !!triggers.error ||
              !available.length ||
              !!pending
            }
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={15} />
            Add point rule
          </Button>
        }
      />
      <div className="admin-notice">
        <ShieldCheck size={20} />
        <div>
          <strong>Historical points stay as they were.</strong>
          <p>
            Rule changes apply to future qualifying activity. Existing valid
            awards keep their original values.
          </p>
        </div>
      </div>
      {loading ? (
        <LoadingState label="Loading point configuration..." />
      ) : rules.error || triggers.error ? (
        <ErrorState
          error={(rules.error || triggers.error)!}
          retry={() => {
            void rules.refetch();
            void triggers.refetch();
          }}
        />
      ) : (
        <>
          <div className="admin-overview">
            <span>
              <strong>{rules.data?.length ?? 0}</strong>Configured rules
            </span>
            <span>
              <strong>
                {rules.data?.filter((r) => r.enabled).length ?? 0}
              </strong>
              Enabled
            </span>
            <span>
              <strong>{available.length}</strong>Available triggers
            </span>
            <span className="badge badge-neutral">
              <SlidersHorizontal size={13} />
              Controlled trigger registry
            </span>
          </div>
          <section className="panel rules-panel">
            <div className="panel-heading">
              <div>
                <h2>Point rules</h2>
                <p className="panel-subtitle">
                  One rule per supported trigger. Values range from 0 to 100.
                </p>
              </div>
            </div>
            {rules.data?.length ? (
              <>
                <div className="rules-head" aria-hidden="true">
                  <span>Activity</span>
                  <span>Points</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                <ul className="rules-list">
                  {rules.data.map((rule) => {
                    const trigger = triggers.data?.find(
                      (t) => t.key === rule.triggerKey,
                    );
                    return (
                      <li className="rule-row" key={rule.id}>
                        <div className="rule-activity">
                          <h3>{trigger?.label ?? rule.triggerKey}</h3>
                          <p>
                            {trigger?.description ??
                              'Supported tracking activity.'}
                          </p>
                          <code>{rule.triggerKey}</code>
                        </div>
                        <span className="rule-points">
                          <strong>{rule.points}</strong>
                          <small> pts</small>
                        </span>
                        <label className="switch-label rule-switch">
                          <input
                            type="checkbox"
                            role="switch"
                            checked={rule.enabled}
                            disabled={!!pending}
                            aria-label={`Enable ${trigger?.label ?? rule.triggerKey}`}
                            onChange={() => void toggle(rule)}
                          />
                          <i aria-hidden="true" />
                          <span>
                            {pending === rule.id
                              ? 'Saving...'
                              : rule.enabled
                                ? 'Enabled'
                                : 'Disabled'}
                          </span>
                        </label>
                        <div className="rule-actions">
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Edit ${trigger?.label ?? rule.triggerKey}`}
                            disabled={!!pending}
                            onClick={() => {
                              setEditing(rule);
                              setOpen(true);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Delete ${trigger?.label ?? rule.triggerKey}`}
                            disabled={!!pending}
                            onClick={() => {
                              setError('');
                              setDeleting(rule);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <EmptyState
                title="Choose what to recognize"
                description="Create a rule from the supported triggers to begin rewarding consistent tracking."
                action={
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    Create a point rule
                  </Button>
                }
              />
            )}
          </section>
          {!available.length && (
            <p className="admin-registry-note">
              <Info size={13} />
              Every supported trigger already has a rule. Edit an existing rule
              to change its value.
            </p>
          )}
          {error && !deleting && (
            <p className="form-error admin-feedback" role="alert">
              {error}
            </p>
          )}
          {feedback && (
            <p className="form-success admin-feedback" role="status">
              {feedback}
            </p>
          )}
          <Modal
            open={open}
            onOpenChange={setOpen}
            title={editing ? 'Update point rule' : 'Recognize a daily action'}
            description="Choose a supported activity and its point value. No formulas or custom trigger logic."
          >
            <RuleForm
              key={editing?.id ?? 'new'}
              rule={editing}
              triggers={
                editing
                  ? (triggers.data ?? []).filter(
                      (t) => t.key === editing.triggerKey,
                    )
                  : available
              }
              onSaved={async () => {
                setOpen(false);
                await changed(
                  'Point rule saved. Historical awards are unchanged.',
                );
              }}
            />
          </Modal>
          <ConfirmDialog
            open={!!deleting}
            onOpenChange={(value) => {
              if (!value) setDeleting(null);
            }}
            title="Delete this point rule?"
            description="Future activity will no longer earn this award until a rule is created again. Historical awards remain unchanged."
            pending={!!pending}
            error={error || undefined}
            onConfirm={() => void remove()}
            label="Delete rule"
          />
        </>
      )}
    </>
  );
}
function RuleForm({
  rule,
  triggers,
  onSaved,
}: {
  rule: PointRuleDto | null;
  triggers: PointTriggerDto[];
  onSaved: () => Promise<void>;
}) {
  const [error, setError] = useState('');
  const form = useForm<PointRuleInput>({
    resolver: zodResolver(pointRuleInputSchema),
    defaultValues: {
      triggerKey: rule?.triggerKey ?? triggers[0]?.key,
      points: rule?.points ?? 10,
      enabled: rule?.enabled ?? true,
    },
  });
  async function submit(input: PointRuleInput) {
    setError('');
    try {
      if (rule)
        await adminApi.update(rule.id, {
          points: input.points,
          enabled: input.enabled,
        });
      else await adminApi.create(input);
      await onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'The rule could not be saved.',
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
        id="rule-trigger"
        label="Supported activity"
        error={form.formState.errors.triggerKey?.message}
      >
        <select
          className="input"
          id="rule-trigger"
          {...form.register('triggerKey')}
          disabled={!!rule}
          aria-describedby="rule-trigger-help"
        >
          {triggers.map((trigger) => (
            <option value={trigger.key} key={trigger.key}>
              {trigger.label}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="rule-points"
        label="Points awarded"
        error={form.formState.errors.points?.message}
        hint="A whole number between 0 and 100."
      >
        <input
          className="input"
          id="rule-points"
          type="number"
          min={0}
          max={100}
          step={1}
          {...form.register('points', { valueAsNumber: true })}
          aria-invalid={!!form.formState.errors.points}
          aria-describedby="rule-points-help"
        />
      </Field>
      <label className="check-label">
        <input type="checkbox" {...form.register('enabled')} />
        Enabled for future qualifying activity
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={form.formState.isSubmitting}>
        {rule ? 'Save changes' : 'Create rule'}
      </Button>
    </form>
  );
}
