import { Brand } from '../components/ui/Brand';
import { Button } from '../components/ui/Button';
export function RecoveryPage() {
  return (
    <main className="recovery-page">
      <Brand />
      <h1>Let's take another breath.</h1>
      <p>This page could not be displayed. Reload to try again.</p>
      <Button onClick={() => window.location.reload()}>Reload page</Button>
    </main>
  );
}
