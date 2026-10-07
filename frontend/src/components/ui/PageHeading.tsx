import type { ReactNode } from 'react';
export function PageHeading({
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading compact-heading">
      <div>
        <h1 className="sr-only">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </header>
  );
}
