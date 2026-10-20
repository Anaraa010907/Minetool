import { useState } from "react";
import { db } from "../db/index.js";
import { fmtLong, daysSince } from "../hooks.js";
import Sheet from "../components/Sheet.jsx";
import Icon from "../components/Icons.jsx";
import { PageTitle, ToolThumb, SelectField, Empty } from "../components/Bits.jsx";

export default function Repairs({ tools, repairs, reload, notify, onBack }) {
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
      <PageTitle
        title="Засвар, үйлчилгээ"
        sub={`${active.length} багаж засварт байна`}
        onBack={onBack}
        action={
          <button className="btn primary" onClick={() => { setErr(""); setNewOpen(true); }}>
            <Icon name="plus" size={20} /> Засварт өгөх
          </button>
        }
      />

      <section className="card">
        <h2 className="card-title">Засварт байгаа</h2>
        {active.length === 0 ? (
          <Empty title="Засварт багаж алга" hint="Эвдэрсэн багажийг засварт өгвөл энд хяналтад орно." />
        ) : (
          active.map((r) => {
            const t = tool(r.toolId);
            const days = daysSince(r.startedAt);
            return (
              <div className="list-row" key={r.id}>
                {t && <ToolThumb tool={t} />}
                <div className="grow">
                  <div className="cell-name">{t?.name || "—"}</div>
                  <div className="cell-sub">{r.description}</div>
                  <div className="cell-sub">{days === 0 ? "Өнөөдрөөс" : `${days} хоног`} засварт</div>
                </div>
                <button className="btn small primary" onClick={() => setFinishing(r.id)}>Дуусгах</button>
              </div>
            );
          })
        )}
      </section>

      {done.length > 0 && (
        <section className="card">
          <h2 className="card-title">Засварын түүх</h2>
          {done.map((r) => (
            <div className="list-row" key={r.id}>
              <div className="grow">
                <div className="cell-name">{tool(r.toolId)?.name || "—"}</div>
                <div className="cell-sub" style={{ whiteSpace: "normal" }}>
                  {r.description}
                  {r.result ? `. Хийсэн ажил: ${r.result}` : ""}
                </div>
                <div className="cell-sub">
                  {fmtLong(r.finishedAt)}
                  {r.cost != null ? `, ${r.cost.toLocaleString("mn-MN")}₮` : ""}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {newOpen && (
        <Sheet
          title="Засварт өгөх"
          onClose={() => setNewOpen(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setNewOpen(false)}>Болих</button>
              <button type="submit" form="repair-form" className="btn primary">Засварт өгөх</button>
            </>
          }
        >
          <form id="repair-form" onSubmit={start}>
            <div className="field">
              <label htmlFor="r-tool">Багаж</label>
              <SelectField id="r-tool" value={toolId} onChange={(e) => setToolId(e.target.value)}>
                <option value="">Сонгох</option>
                {eligible.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
              </SelectField>
              <p className="help">Зөвхөн бэлэн байгаа багаж харагдана.</p>
            </div>
            <div className="field">
              <label htmlFor="r-desc">Эвдрэл, хийх ажил</label>
              <textarea id="r-desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            {err && <p className="msg error"><Icon name="alert" size={18} /> {err}</p>}
          </form>
        </Sheet>
      )}

      {finishingRepair && (
        <Sheet
          title="Засвар дуусгах"
          onClose={() => setFinishing(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setFinishing(null)}>Болих</button>
              <button type="submit" form="finish-form" className="btn primary">Агуулахад буцаах</button>
            </>
          }
        >
          <p className="muted" style={{ marginBottom: 18 }}>
            {tool(finishingRepair.toolId)?.name}: {finishingRepair.description}
          </p>
          <form id="finish-form" onSubmit={finish}>
            <div className="field">
              <label htmlFor="f-res">Хийсэн ажил</label>
              <input id="f-res" value={result} onChange={(e) => setResult(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="f-cost">Зардал (₮)</label>
              <input id="f-cost" type="number" inputMode="numeric" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
              <p className="help">Заавал биш.</p>
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
}
