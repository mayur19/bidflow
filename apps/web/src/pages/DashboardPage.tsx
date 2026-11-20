import { ROLE_LABELS } from '@bidflow/shared';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { navItemsFor } from '../routes/navigation';

/**
 * Role-based landing page (PRD §4.1). Lists the screens this role can open.
 * TODO(BF-048): replace with the buyer dashboard cards (pending approvals,
 * active RFQs, committed spend, late deliveries).
 */
export function DashboardPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;
  const { user } = state;
  const links = navItemsFor(user.role).filter((item) => item.path !== '/');

  return (
    <section>
      <h1>Welcome, {user.displayName}</h1>
      <p className="muted">
        Signed in as {ROLE_LABELS[user.role]} at {user.organizationName}. Dashboard metrics are
        tracked as <code>BF-048</code>.
      </p>
      <ul className="link-grid">
        {links.map((item) => (
          <li key={item.path}>
            <Link to={item.path} className="card link-card">
              <span>{item.label}</span>
              {item.ticket ? <span className="badge badge--pending">Pending</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
