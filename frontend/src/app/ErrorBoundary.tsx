import { Component, type ReactNode } from 'react';
import { RecoveryPage } from '../pages/RecoveryPage';
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <RecoveryPage /> : this.props.children;
  }
}
