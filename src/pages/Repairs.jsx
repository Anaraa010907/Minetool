import { useState } from "react";
import { db } from "../db/index.js";
import { fmtDate } from "../hooks.js";

export default function Repairs({ tools, repairs, reload }) {
  const [toolId, setToolId] = useState("");
  const [desc, setDesc] = useState("");
  const [finishing, setFinishing] = useState(null);
  const [result, setResult] = useState("");
  const [cost, setCost] = useState("");
  const [err, setErr] = useState("");

  const tn = (id) => tools.find((t) => t.id === id)?.name || "—";
  const eligible = tools.filter((t) => t.status === "available");
  const active = repairs.filter((r) => !r.finishedAt);
  const done = repairs.filter((r) => r.finishedAt).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, 20);

  const start = async (e) => {
    e.preventDefault();
    setErr("");
    if (!toolId || !desc.trim()) return setErr("Багаж болон эвдрэлийн тайлбараа бөглөнө үү");
    try {
      await db.startRepair(toolId, desc.trim());
      setToolId("");
      setDesc("");
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
    reload();
  };

  return (
    <>
      <form className="card" onSubmit={start}>
        <h2>Засварт шилжүүлэх</h2>
        <label>Багаж (агуулахад байгаа)</label>
        <select value={toolId} onChange={(e) => setToolId(e.target.value)}>
          <option value="">— сонгох —</option>
          {eligible.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
        </select>
        <label>Эвдрэл / хийх ажил</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
        {err && <p className="error">{err}</p>}
        <button className="btn gold block">Засварт өгөх</button>
      </form>

      <div className="card">
        <h2>Засварт байгаа ({active.length})</h2>
        {active.length === 0 && <div className="empty">Засварт багаж алга</div>}
        {active.map((r) => (
          <div key={r.id}>
            <div className="item">
              <div>
                <div className="name">{tn(r.toolId)}</div>
                <div className="sub">{r.description} · {fmtDate(r.startedAt)}</div>
              </div>
              <button className="btn green small" onClick={() => setFinishing(r.id)}>Дуусгах</button>
            </div>
            {finishing === r.id && (
              <form onSubmit={finish} style={{ paddingBottom: 10 }}>
                <label>Хийсэн ажил</label>
                <input value={result} onChange={(e) => setResult(e.target.value)} />
                <label>Зардал (₮, заавал биш)</label>
                <input type="number" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} />
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn green">Агуулахад буцаах</button>
                  <button type="button" className="btn" onClick={() => setFinishing(null)}>Болих</button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Засварын түүх</h2>
        {done.length === 0 && <div className="empty">Түүх алга</div>}
        {done.map((r) => (
          <div className="item" key={r.id}>
            <div>
              <div className="name">{tn(r.toolId)}</div>
              <div className="sub">
                {r.description} → {r.result || "—"} · {fmtDate(r.finishedAt)}
                {r.cost != null ? ` · ${r.cost.toLocaleString("mn-MN")}₮` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
