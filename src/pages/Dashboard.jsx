import { buildEvents, ago } from "../hooks.js";
import Icon from "../components/Icons.jsx";
import { PageTitle, ToolThumb, Empty } from "../components/Bits.jsx";

export default function Dashboard({ tools, workers, loans, go }) {
  const active = tools.filter((t) => t.status !== "retired");
  const count = (s) => tools.filter((t) => t.status === s).length;
  const tool = (id) => tools.find((t) => t.id === id);
  const worker = (id) => workers.find((w) => w.id === id);

  const open = loans.filter((l) => !l.returnedAt).sort((a, b) => a.issuedAt.localeCompare(b.issuedAt));
  const events = buildEvents(loans).slice(0, 5);

  const stats = [
    { key: "all", label: "Нийт багаж", value: active.length, icon: "cube", cls: "" },
    { key: "available", label: "Бэлэн", value: count("available"), icon: "check", cls: "s-available" },
    { key: "issued", label: "Олгосон", value: count("issued"), icon: "download", cls: "s-issued" },
    { key: "repair", label: "Засварт", value: count("repair"), icon: "wrench", cls: "s-repair" },
  ];

  return (
    <>
      <PageTitle eyebrow="Уурхайн агуулах" title="Самбар" sub="Багажны өнөөдрийн байдал" />

      <div className="stat-grid">
        {stats.map((s) => (
          <button key={s.key} className={"stat " + s.cls} onClick={() => go("tools", s.key)}>
            <span className="ico"><Icon name={s.icon} size={20} /></span>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="quick">
        <button className="btn primary" onClick={() => go("issue")}><Icon name="download" size={20} /> Багаж олгох</button>
        <button className="btn" onClick={() => go("return")}><Icon name="swap" size={20} /> Багаж буцаах</button>
      </div>

      <section className="card">
        <h2 className="card-title">Одоо олгогдсон багаж</h2>
        {open.length === 0 ? (
          <Empty title="Олгогдсон багаж алга" hint="Багаж олгосон даруйд энд харагдана." />
        ) : (
          open.slice(0, 6).map((l) => {
            const t = tool(l.toolId);
            return (
              <div className="list-row" key={l.id}>
                {t && <ToolThumb tool={t} />}
                <div className="grow">
                  <div className="cell-name">{t?.name || "—"}</div>
                  <div className="cell-sub">{worker(l.workerId)?.name || "—"}, {ago(l.issuedAt)}</div>
                </div>
              </div>
            );
          })
        )}
        {open.length > 6 && (
          <button className="list-row" onClick={() => go("tools", "issued")}>
            <div className="grow cell-name">Бүгдийг харах ({open.length})</div>
            <span className="chev"><Icon name="right" size={18} /></span>
          </button>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Сүүлийн үйл явдал</h2>
        {events.length === 0 ? (
          <Empty title="Үйл явдал алга" hint="Олголт, буцаалт хийгдэхэд энд бүртгэгдэнэ." />
        ) : (
          events.map((e) => (
            <div className="list-row" key={e.id}>
              <span className={"act " + e.type}>
                <Icon name={e.type === "out" ? "download" : "swap"} size={20} />
              </span>
              <div className="grow">
                <div className="cell-name">{tool(e.toolId)?.name || "—"}</div>
                <div className="cell-sub">
                  {e.type === "out" ? "Олгосон" : "Буцаасан"}: {worker(e.workerId)?.name || "—"}, {ago(e.at)}
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
