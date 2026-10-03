import { Component, type ReactNode } from 'react';
import { Brand } from '../components/ui/Brand';
import { Button } from '../components/ui/Button';
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="recovery-page">
          <Brand />
          <h1>Let's take another breath.</h1>
          <p>This page could not be displayed. Reload to try again.</p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </main>
      );
    return this.props.children;
  }
}
