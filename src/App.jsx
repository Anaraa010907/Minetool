import { useCallback, useEffect, useRef, useState } from "react";
import { useData } from "./hooks.js";
import { connection } from "./db/index.js";
import Icon from "./components/Icons.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Issue from "./pages/Issue.jsx";
import Tools from "./pages/Tools.jsx";
import More from "./pages/More.jsx";

const TABS = [
  { id: "home", label: "Самбар", icon: "home" },
  { id: "issue", label: "Багаж олгох", icon: "download" },
  { id: "return", label: "Багаж буцаах", icon: "swap" },
  { id: "tools", label: "Бүртгэл", icon: "cube" },
  { id: "more", label: "Бусад", icon: "menu" },
];

export default function App() {
  const [tab, setTab] = useState("home");
  const [toolFilter, setToolFilter] = useState("all"); // Самбараас Бүртгэл рүү шүүлтүүртэй орох
  const [toast, setToast] = useState("");
  const timer = useRef();
  const data = useData();

  const notify = useCallback((text) => {
    setToast(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (id, filter = "all") => {
    setToolFilter(filter);
    setTab(id);
    window.scrollTo({ top: 0 });
  };
  const props = { ...data, notify, go };

  return (
    <>
      <header className="topbar">
        <span className="logo-tile"><Icon name="cube" size={22} /></span>
        <span className="brand">MineTool</span>
        {connection.mode === "local" && <span className="badge-demo">Демо</span>}
        <span className="spacer" />
        <div className={"conn " + (connection.mode === "remote" ? "on" : "local")} title={connection.note}>
          <i />
          <span>{connection.mode === "remote" ? "Холбогдсон" : connection.label}</span>
        </div>
        <span className="user-chip" aria-label="Хэрэглэгч">АС</span>
      </header>

      <div className="layout">
        <nav className="nav" aria-label="Үндсэн цэс">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={"nav-item" + (tab === t.id ? " active" : "")}
              onClick={() => go(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
            >
              <Icon name={t.icon} size={24} />
              {t.label}
            </button>
          ))}
        </nav>

        <main className="content">
          {data.loading ? (
            <p className="muted">Ачаалж байна…</p>
          ) : (
            <>
              {tab === "home" && <Dashboard {...props} />}
              {tab === "issue" && <Issue key="issue" mode="issue" {...props} />}
              {tab === "return" && <Issue key="return" mode="return" {...props} />}
              {tab === "tools" && <Tools key={toolFilter} initialFilter={toolFilter} {...props} />}
              {tab === "more" && <More {...props} />}
            </>
          )}
        </main>
      </div>

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}
