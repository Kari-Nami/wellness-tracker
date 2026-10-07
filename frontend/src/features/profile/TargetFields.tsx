import { X } from 'lucide-react';
import {
  type Goals,
  MAX_SLEEP_HOURS,
  MAX_WATER_ML,
  moodSchema,
  bowelStatusSchema,
} from '../../types/contracts';
import { Field } from '../../components/ui/Field';
import { titleCase } from '../../lib/format';
export function TargetFields({
  value,
  onChange,
  prefix = 'target',
  disabled = false,
}: {
  value: Goals;
  onChange: (value: Goals) => void;
  prefix?: string;
  disabled?: boolean;
}) {
  const numeric = [
    {
      key: 'sleepHours',
      label: 'Sleep target (hours)',
      max: MAX_SLEEP_HOURS,
      step: 0.25,
      scale: 1,
    },
    {
      key: 'waterMl',
      label: 'Water target (liters)',
      max: MAX_WATER_ML / 1000,
      step: 0.05,
      scale: 1000,
    },
    { key: 'mealsPerDay', label: 'Meals per day', max: 10, step: 1, scale: 1 },
  ] as const;
  return (
    <div className="form-grid target-fields">
      {numeric.map(({ key, label, max, step, scale }) => (
        <Field key={key} id={prefix + '-' + key} label={label}>
          <div className="target-number">
            <input
              className="input"
              id={prefix + '-' + key}
              type="number"
              min={0}
              max={max}
              step={step}
              placeholder="No target"
              disabled={disabled}
              value={
                value[key] === null || Number.isNaN(value[key])
                  ? ''
                  : value[key]! / scale
              }
              onChange={(e) =>
                onChange({
                  ...value,
                  [key]:
                    e.target.value === ''
                      ? null
                      : scale === 1000
                        ? Math.round(
                            Math.min(max, Math.max(0, Number(e.target.value))) *
                              scale,
                          )
                        : Math.min(max, Math.max(0, Number(e.target.value))),
                })
              }
            />
            <button
              type="button"
              className="icon-button"
              disabled={disabled || value[key] === null}
              aria-label={'Clear ' + label.toLowerCase().split(' (')[0]}
              onClick={() => onChange({ ...value, [key]: null })}
            >
              <X size={15} />
            </button>
          </div>
        </Field>
      ))}
      <Field label="Mood target" id={prefix + '-mood'}>
        <select
          className="input"
          disabled={disabled}
          id={prefix + '-mood'}
          value={value.targetMood ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              targetMood:
                e.target.value === ''
                  ? null
                  : moodSchema.parse(Number(e.target.value)),
            })
          }
        >
          <option value="">No target</option>
          {['Very bad', 'Bad', 'Okay', 'Good', 'Great'].map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Bowel movement target" id={prefix + '-bowel'}>
        <select
          className="input"
          disabled={disabled}
          id={prefix + '-bowel'}
          value={value.targetBowelStatus ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              targetBowelStatus:
                e.target.value === ''
                  ? null
                  : bowelStatusSchema.parse(e.target.value),
            })
          }
        >
          <option value="">No target</option>
          {bowelStatusSchema.options.map((v) => (
            <option key={v} value={v}>
              {titleCase(v)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
