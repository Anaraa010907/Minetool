import { useState } from "react";
import { db } from "../db/index.js";
import { fmtDate, daysSince } from "../hooks.js";
import Sheet from "../components/Sheet.jsx";
import Icon from "../components/Icons.jsx";
import { CodeTag, PageHead, Empty } from "../components/Bits.jsx";

export default function Repairs({ tools, repairs, reload, notify }) {
  const [newOpen, setNewOpen] = useState(false);
  const [toolId, setToolId] = useState("");
  const [desc, setDesc] = useState("");
  const [finishing, setFinishing] = useState(null); // засварын id
  const [result, setResult] = useState("");
  const [cost, setCost] = useState("");
  const [err, setErr] = useState("");

  const tool = (id) => tools.find((t) => t.id === id);
  const eligible = tools.filter((t) => t.status === "available");
  const active = repairs.filter((r) => !r.finishedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const done = repairs.filter((r) => r.finishedAt).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, 20);
  const finishingRepair = repairs.find((r) => r.id === finishing);

  const start = async (e) => {
    e.preventDefault();
    if (!toolId || !desc.trim()) return setErr("Багаж сонгоод эвдрэлийн тайлбараа бичнэ үү");
    try {
      await db.startRepair(toolId, desc.trim());
      setNewOpen(false);
      setToolId("");
      setDesc("");
      setErr("");
      notify("Засварт шилжлээ");
      reload();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const finish = async (e) => {
    e.preventDefault();
    await db.finishRepair(finishing, { result: result.trim(), cost });
    setFinishing(null);
    setResult("");
    setCost("");
    notify("Багаж агуулахад буцлаа");
    reload();
  };

  return (
    <>
      <PageHead
        title="Засвар"
        sub={`${active.length} багаж засварт байна`}
        action={
          <button className="btn primary" onClick={() => { setErr(""); setNewOpen(true); }}>
            <Icon name="plus" size={20} /> Засварт өгөх
          </button>
        }
      />

      <div className="panel">
        {active.length === 0 ? (
          <Empty title="Засварт багаж алга" hint="Эвдэрсэн багажийг засварт өгвөл энд хяналтад орно." />
        ) : (
          active.map((r) => {
            const t = tool(r.toolId);
            const days = daysSince(r.startedAt);
            return (
              <div className="row-item plain stripe s-repair" key={r.id}>
                <div className="grow">
                  <div className="row-name">{t?.name || "—"}</div>
                  <div className="row-sub">{r.description}</div>
                  <div className="row-sub">{days === 0 ? "Өнөөдөр" : `${days} хоног`} засварт</div>
                </div>
                <div style={{ textAlign: "right", display: "grid", gap: 6, justifyItems: "end" }}>
                  {t && <CodeTag code={t.code} />}
                  <button className="btn small primary" onClick={() => setFinishing(r.id)}>Дуусгах</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {done.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Засварын түүх</h3>
          {done.map((r) => (
            <div className="row-item plain" key={r.id}>
              <div className="grow">
                <div className="row-name">{tool(r.toolId)?.name || "—"}</div>
                <div className="row-sub" style={{ whiteSpace: "normal" }}>
                  {r.description}
                  {r.result ? `. Хийсэн ажил: ${r.result}` : ""}
                </div>
                <div className="row-sub">
                  {fmtDate(r.finishedAt)}
                  {r.cost != null ? `, ${r.cost.toLocaleString("mn-MN")}₮` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {newOpen && (
        <Sheet title="Засварт өгөх" onClose={() => setNewOpen(false)}>
          <form onSubmit={start}>
            <div className="field">
              <label htmlFor="r-tool">Багаж</label>
              <select id="r-tool" value={toolId} onChange={(e) => setToolId(e.target.value)}>
                <option value="">Сонгох</option>
                {eligible.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
              </select>
              <p className="help">Зөвхөн агуулахад байгаа багаж харагдана.</p>
            </div>
            <div className="field">
              <label htmlFor="r-desc">Эвдрэл, хийх ажил</label>
              <textarea id="r-desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            {err && <p className="msg error"><Icon name="alert" size={18} /> {err}</p>}
            <div className="form-actions">
              <button type="button" className="btn quiet" onClick={() => setNewOpen(false)}>Болих</button>
              <button className="btn primary">Засварт өгөх</button>
            </div>
          </form>
        </Sheet>
      )}

      {finishingRepair && (
        <Sheet title="Засвар дуусгах" onClose={() => setFinishing(null)}>
          <p className="row-sub" style={{ whiteSpace: "normal", marginBottom: 14 }}>
            {tool(finishingRepair.toolId)?.name}: {finishingRepair.description}
          </p>
          <form onSubmit={finish}>
            <div className="field">
              <label htmlFor="f-res">Хийсэн ажил</label>
              <input id="f-res" value={result} onChange={(e) => setResult(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="f-cost">Зардал (₮)</label>
              <input id="f-cost" type="number" inputMode="numeric" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
              <p className="help">Заавал биш.</p>
            </div>
            <div className="form-actions">
              <button type="button" className="btn quiet" onClick={() => setFinishing(null)}>Болих</button>
              <button className="btn primary">Агуулахад буцаах</button>
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
}
