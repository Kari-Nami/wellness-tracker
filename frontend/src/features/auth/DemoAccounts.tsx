import { ArrowUpRight, Check } from 'lucide-react';
import { DEMO_ACCOUNTS } from '../../types/demoAccounts';
import { isDemoMode } from '../../config/mode';
import type { LoginInput } from '../../types/contracts';
const availableDemoAccounts = isDemoMode
  ? [
      {
        key: 'alex',
        role: 'user',
        displayName: 'Alex Morgan',
        email: 'alex@example.com',
        password: 'wellness123',
        description: 'Explore sample wellness history.',
      },
      {
        key: 'admin',
        role: 'admin',
        displayName: 'Demo administrator',
        email: 'admin@example.com',
        password: 'wellness123',
        description: 'Explore point rules and activity configuration.',
      },
    ]
  : DEMO_ACCOUNTS;
export function DemoAccounts({
  onSelect,
  selectedEmail,
  selectedPassword,
  disabled = false,
}: {
  onSelect: (credentials: LoginInput) => void;
  selectedEmail: string;
  selectedPassword: string;
  disabled?: boolean;
}) {
  return (
    <section className="demo-accounts" aria-labelledby="demo-accounts-heading">
      <div className="demo-accounts-heading">
        <h3 id="demo-accounts-heading">Try Wellness Tracker</h3>
        <span>{isDemoMode ? 'Sample workspace' : 'Shared demo accounts'}</span>
      </div>
      <p>Choose an account to fill the form, then sign in.</p>
      <div className="demo-account-grid">
        {availableDemoAccounts.map((account) => (
          <button
            key={account.key}
            className="demo-account"
            type="button"
            disabled={disabled}
            aria-label={'Fill ' + account.displayName + ' credentials'}
            aria-pressed={
              selectedEmail === account.email &&
              selectedPassword === account.password
            }
            onClick={() =>
              onSelect({ email: account.email, password: account.password })
            }
          >
            <span className="demo-account-title">
              <strong>
                {account.role === 'admin'
                  ? 'Administrator'
                  : account.displayName.split(' ')[0]}
              </strong>
              <span>{account.role === 'admin' ? 'Admin' : 'Member'}</span>
            </span>
            <code>{account.email}</code>
            <span className="demo-account-description">
              {account.description}
            </span>
            <span className="demo-account-action">
              {selectedEmail === account.email &&
              selectedPassword === account.password ? (
                <>
                  <Check size={12} />
                  Filled
                </>
              ) : (
                <>
                  Fill credentials <ArrowUpRight size={12} />
                </>
              )}
            </span>
          </button>
        ))}
      </div>
      <p className="demo-account-password">
        Password for every demo:{' '}
        <code>{availableDemoAccounts[0].password}</code>
      </p>
      {!isDemoMode && (
        <p className="demo-account-shared">
          Sample data and edits are shared between visitors.
        </p>
      )}
    </section>
  );
}
