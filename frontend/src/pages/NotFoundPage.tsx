import { Link } from 'react-router-dom';
import { ArrowRight, Leaf } from 'lucide-react';
import { Brand } from '../components/ui/Brand';
export function NotFoundPage() {
  return (
    <main className="recovery-page">
      <Brand />
      <Leaf size={45} strokeWidth={1.1} />
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>Let's find your way back.</h1>
      <p>This page doesn't exist. Your daily space is still here.</p>
      <Link className="button button-primary" to="/">
        Back to Wellness Tracker <ArrowRight size={15} />
      </Link>
    </main>
  );
}
