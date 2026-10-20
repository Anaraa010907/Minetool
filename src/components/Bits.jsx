import { useEffect, useState } from "react";
import { STATUS_LABEL } from "../hooks.js";
import { getPhotoUrl } from "../db/photos.js";
import Icon from "./Icons.jsx";

export const StatusPill = ({ status }) => (
  <span className={"pill s-" + status}>
    <i />
    {STATUS_LABEL[status]}
  </span>
);

export const Avatar = ({ name, size = 40 }) => {
  const parts = (name || "?").trim().split(/\s+/);
  const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials || "?"}
    </span>
  );
};

export const PageTitle = ({ eyebrow, title, sub, action, onBack }) => (
  <div className="page-title">
    {onBack && (
      <button type="button" className="back" onClick={onBack}>
        <Icon name="left" size={18} /> Бусад
      </button>
    )}
    <div className="page-title-row">
      <div className="page-title-text">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  </div>
);

export const Empty = ({ title, hint, children }) => (
  <div className="empty">
    <b>{title}</b>
    {hint && <p>{hint}</p>}
    {children}
  </div>
);

// Багажны зураг эсвэл үсгэн дүрс бүхий тэмдэг.
export function ToolThumb({ tool, size = 44 }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (tool.hasPhoto) getPhotoUrl(tool.id, tool.photoRev || 0).then((u) => alive && setUrl(u)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [tool.id, tool.hasPhoto, tool.photoRev]);

  return (
    <span className="thumb" style={{ width: size, height: size }}>
      {url ? <img src={url} alt="" /> : <Icon name="wrench" size={size * 0.46} />}
    </span>
  );
}

export function SelectField({ value, onChange, children, icon, label, id }) {
  return (
    <div className="select">
      {icon && <span className="select-ico"><Icon name={icon} size={20} /></span>}
      <select id={id} value={value} onChange={onChange} aria-label={label} className={icon ? "has-ico" : ""}>
        {children}
      </select>
      <span className="select-chev"><Icon name="down" size={20} /></span>
    </div>
  );
}

export function Pagination({ page, pages, from, to, total, onPage }) {
  return (
    <div className="pager">
      <span>{total === 0 ? "0" : `${from}–${to}`} / {total}</span>
      <div className="pager-ctl">
        <button type="button" className="pager-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Өмнөх">
          <Icon name="left" size={20} />
        </button>
        <span>{Math.min(page, pages)} / {pages}</span>
        <button type="button" className="pager-btn" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Дараах">
          <Icon name="right" size={20} />
        </button>
      </div>
    </div>
  );
}

// Жагсаалтыг хуудаслана.
export function paginate(rows, page, perPage) {
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * perPage;
  return { rows: rows.slice(start, start + perPage), page: p, pages, from: start + 1, to: Math.min(start + perPage, rows.length), total: rows.length };
}
