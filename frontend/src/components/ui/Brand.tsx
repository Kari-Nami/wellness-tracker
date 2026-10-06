import { Link } from 'react-router-dom';
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Wellness Tracker home">
      <img
        className="brand-mark"
        src={`${import.meta.env.BASE_URL}brand-mark.svg`}
        width="35"
        height="35"
        alt=""
      />
      <span>Wellness Tracker</span>
    </Link>
  );
}
