import './AuthShell.css';

/** Centered card layout shared by the Login and Register pages. */
function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="au-page">
      <div className="au-wrap">
        <div className="au-brand-head">
          <span className="au-logo"></span>
          <span className="au-name">Gym Manager</span>
        </div>

        <div className="au-card">
          <h1>{title}</h1>
          <p className="au-sub">{subtitle}</p>
          {children}
          {footer && <p className="au-switch">{footer}</p>}
        </div>

        <p className="au-foot">© {new Date().getFullYear()} Gym Manager</p>
      </div>
    </div>
  );
}

export default AuthShell;