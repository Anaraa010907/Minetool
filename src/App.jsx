import { useState } from "react";
import { useData } from "./hooks.js";
import Tools from "./pages/Tools.jsx";
import Issue from "./pages/Issue.jsx";
import Repairs from "./pages/Repairs.jsx";
import Workers from "./pages/Workers.jsx";

const TABS = [
  { id: "tools", label: "Багаж", ico: "🧰" },
  { id: "issue", label: "Олгох/Авах", ico: "🔁" },
  { id: "repairs", label: "Засвар", ico: "🔧" },
  { id: "workers", label: "Ажилчид", ico: "👷" },
];

export default function App() {
  const [tab, setTab] = useState("tools");
  const data = useData();

  return (
    <div className="app">
      <header className="top">
        <h1>⛏ Minetool</h1>
        <p>Уурхайн багажны бүртгэл</p>
      </header>
      <main>
        {data.loading ? (
          <div className="empty">Ачаалж байна…</div>
        ) : (
          <>
            {tab === "tools" && <Tools {...data} />}
            {tab === "issue" && <Issue {...data} />}
            {tab === "repairs" && <Repairs {...data} />}
            {tab === "workers" && <Workers {...data} />}
          </>
        )}
      </main>
      <nav className="tabs">
        <div className="inner">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
              <span className="ico">{t.ico}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
