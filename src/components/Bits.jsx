import { STATUS_LABEL } from "../hooks.js";

// Багажны код — металл шошго маягтай.
export const CodeTag = ({ code }) => <span className="plate">{code}</span>;

export const StatusText = ({ status }) => (
  <span className={"status s-" + status}>
    <i />
    {STATUS_LABEL[status]}
  </span>
);

export const Avatar = ({ name }) => {
  const parts = (name || "?").trim().split(/\s+/);
  const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  return <span className="avatar">{initials || "?"}</span>;
};

export const PageHead = ({ title, sub, action }) => (
  <div className="page-head">
    <div>
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
    {action}
  </div>
);

export const Empty = ({ title, hint, children }) => (
  <div className="empty">
    <b>{title}</b>
    {hint && <p>{hint}</p>}
    {children}
  </div>
);
