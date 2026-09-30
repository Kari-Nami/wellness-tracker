import { Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Daywell home">
      <span className="brand-mark">
        <Sprout size={23} strokeWidth={1.7} />
      </span>
      <span>
        daywell<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
