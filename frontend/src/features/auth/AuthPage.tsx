import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Leaf,
  Moon,
  Droplets,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import {
  loginInputSchema,
  registerInputSchema,
  type LoginInput,
  type RegisterInput,
} from '../../types/contracts';
import { detectedTimezone } from '../../lib/dates';
import { showDemoAccounts } from '../../config/mode';
import { DemoAccounts } from './DemoAccounts';
import { useAuth } from './context';
import { Brand } from '../../components/ui/Brand';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const registerMode = mode === 'register';
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const schema = registerMode ? registerInputSchema : loginInputSchema;
  const form = useForm<RegisterInput | LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: registerMode
      ? {
          email: '',
          password: '',
          displayName: '',
          timezone: detectedTimezone(),
        }
      : { email: '', password: '' },
  });
  const [selectedEmail, selectedPassword] = useWatch({
    control: form.control,
    name: ['email', 'password'],
  });
  if (auth.user)
    return (
      <Navigate to={auth.user.role === 'admin' ? '/admin' : '/today'} replace />
    );
  const finish = (role: string) => {
    const state: unknown = location.state;
    const from =
      state &&
      typeof state === 'object' &&
      'from' in state &&
      typeof state.from === 'string'
        ? state.from
        : '';
    navigate(
      role === 'admin'
        ? '/admin'
        : /^\/(today|calendar|insights|leaderboard|profile)(?:[/?]|$)/.test(
              from,
            )
          ? from
          : '/today',
      { replace: true },
    );
  };
  async function submit(input: RegisterInput | LoginInput) {
    setError('');
    try {
      const user = registerMode
        ? await auth.register(registerInputSchema.parse(input))
        : await auth.login(loginInputSchema.parse(input));
      finish(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    }
  }
  const errors = form.formState.errors;
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <p className="eyebrow">A LITTLE BETTER, EVERY DAY</p>
          <h1>
            Your everyday,
            <br />a little more
            <br />
            <em>balanced.</em>
          </h1>
          <p>
            A small space to check in with yourself.
            <br />
            Build routines, notice patterns, and keep going.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="illustration-center">
              <Leaf size={64} strokeWidth={1} />
            </div>
            <span className="floating-pill sleep-pill">
              <Moon size={16} /> A good night's rest
            </span>
            <span className="floating-pill water-pill">
              <Droplets size={16} /> One more glass
            </span>
            <span className="floating-pill mood-pill">
              <Heart size={16} /> A moment for you
            </span>
          </div>
          <div className="auth-note">
            <span>
              <Check size={14} /> Simple daily check-ins
            </span>
            <span>
              <ShieldCheck size={14} /> Your wellness stays private
            </span>
          </div>
        </div>
        <p className="auth-story-footer">Small steps count. So do you.</p>
      </section>
      <section className="auth-form-side">
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="auth-form-wrap">
          <span className="auth-leaf">
            <Leaf size={23} />
          </span>
          <p className="eyebrow">
            {registerMode ? 'YOUR NEXT CHAPTER' : 'WELCOME BACK'}
          </p>
          <h2>
            {registerMode
              ? 'Make room for yourself.'
              : 'Good to see you again.'}
          </h2>
          <p className="auth-subtitle">
            {registerMode
              ? 'Create your account and start with a small check-in.'
              : 'Sign in and pick up where you left off.'}
          </p>
          <form
            className="form-stack"
            onSubmit={form.handleSubmit(submit)}
            noValidate
          >
            {registerMode && (
              <Field
                label="Your name"
                id="displayName"
                error={
                  'displayName' in errors
                    ? errors.displayName?.message
                    : undefined
                }
              >
                <input
                  className="input"
                  id="displayName"
                  autoComplete="name"
                  maxLength={50}
                  {...form.register('displayName')}
                  aria-invalid={'displayName' in errors && !!errors.displayName}
                  aria-describedby="displayName-help"
                  placeholder="How should we call you?"
                />
              </Field>
            )}
            <Field
              label="Email address"
              id="email"
              error={errors.email?.message}
            >
              <input
                className="input"
                id="email"
                type="email"
                autoComplete="email"
                {...form.register('email')}
                aria-invalid={!!errors.email}
                aria-describedby="email-help"
                placeholder="you@example.com"
              />
            </Field>
            <Field
              label="Password"
              id="password"
              error={errors.password?.message}
              hint={registerMode ? 'Use at least 8 characters.' : undefined}
            >
              <div className="password-field">
                <input
                  className="input"
                  id="password"
                  type={visible ? 'text' : 'password'}
                  autoComplete={
                    registerMode ? 'new-password' : 'current-password'
                  }
                  maxLength={128}
                  {...form.register('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby="password-help"
                  placeholder={
                    registerMode ? 'Create a password' : 'Enter your password'
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? 'Hide password' : 'Show password'}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {registerMode && (
              <Field
                label="Timezone"
                id="timezone"
                error={
                  'timezone' in errors ? errors.timezone?.message : undefined
                }
                hint="Your daily check-ins follow this timezone."
              >
                <input
                  className="input"
                  id="timezone"
                  {...form.register('timezone')}
                  aria-describedby="timezone-help"
                />
              </Field>
            )}
            {(error || auth.error) && (
              <p className="form-error" role="alert">
                {error || auth.error?.message}
              </p>
            )}
            <Button
              type="submit"
              className="auth-submit"
              loading={form.formState.isSubmitting}
              disabled={auth.loading}
            >
              {registerMode ? 'Create account' : 'Sign in'}
              <ArrowRight size={16} />
            </Button>
          </form>
          <p className="auth-switch">
            {registerMode ? 'Already have an account?' : 'New to Daywell?'}{' '}
            <Link to={registerMode ? '/login' : '/register'}>
              {registerMode ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          {!registerMode && showDemoAccounts && (
            <DemoAccounts
              selectedEmail={selectedEmail ?? ''}
              selectedPassword={selectedPassword ?? ''}
              disabled={form.formState.isSubmitting || auth.loading}
              onSelect={(credentials) => {
                form.reset(credentials);
                setVisible(false);
                setError('');
                form.setFocus('email');
              }}
            />
          )}
          <p className="auth-privacy">
            <ShieldCheck size={13} /> Personal accounts keep your wellness data
            private.
          </p>
        </div>
        <p className="auth-bottom">
          DAYWELL <span>Wellness, one day at a time.</span>
        </p>
      </section>
    </div>
  );
}
