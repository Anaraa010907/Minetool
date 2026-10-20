import { useCallback, useEffect, useRef, useState } from "react";
import { useData } from "./hooks.js";
import Icon from "./components/Icons.jsx";
import Tools from "./pages/Tools.jsx";
import Issue from "./pages/Issue.jsx";
import Repairs from "./pages/Repairs.jsx";
import Workers from "./pages/Workers.jsx";

const TABS = [
  { id: "tools", label: "Багаж", icon: "toolbox" },
  { id: "issue", label: "Олгох / Авах", icon: "swap", primary: true },
  { id: "repairs", label: "Засвар", icon: "wrench" },
  { id: "workers", label: "Ажилчид", icon: "users" },
];

export default function App() {
  const [tab, setTab] = useState("tools");
  const [toast, setToast] = useState("");
  const timer = useRef();
  const data = useData();

  const notify = useCallback((text) => {
    setToast(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const props = { ...data, notify };

  return (
    <div className="shell">
      <div className="side">
        <header className="brand-bar">
          <span className="brand-mark"><Icon name="wrench" size={19} /></span>
          <div>
            <div className="brand-name">Minetool</div>
            <div className="brand-sub">Уурхайн багажны бүртгэл</div>
          </div>
        </header>
        <nav className="nav" aria-label="Үндсэн цэс">
          <div className="nav-inner">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={"nav-item" + (t.primary ? " primary" : "") + (tab === t.id ? " active" : "")}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
              >
                <span className="ico"><Icon name={t.icon} size={22} /></span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="main-col">
        <main className="content">
          {data.loading ? (
            <p style={{ color: "var(--ink-2)" }}>Ачаалж байна…</p>
          ) : (
            <>
              {tab === "tools" && <Tools {...props} goIssue={() => setTab("issue")} />}
              {tab === "issue" && <Issue {...props} />}
              {tab === "repairs" && <Repairs {...props} />}
              {tab === "workers" && <Workers {...props} />}
            </>
          )}
        </main>
      </div>

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </div>
  );
}
