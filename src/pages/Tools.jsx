import { useState } from "react";
import { db, STATUS } from "../db/index.js";
import { STATUS_LABEL, fmtDate } from "../hooks.js";
import BarcodeScanner from "../components/BarcodeScanner.jsx";
import Sheet from "../components/Sheet.jsx";
import Icon from "../components/Icons.jsx";
import { CodeTag, StatusText, PageHead, Empty } from "../components/Bits.jsx";

const CATEGORIES = ["Гар багаж", "Цахилгаан багаж", "Хэмжих хэрэгсэл", "Аюулгүй байдал", "Бусад"];
const emptyForm = { name: "", code: "", category: CATEGORIES[0], location: "", note: "" };
const BAR_COLORS = { available: "var(--ok)", issued: "var(--issued)", repair: "var(--repair)", retired: "var(--retired)" };

export default function Tools({ tools, workers, loans, reload, notify, goIssue }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null); // шинэ / засах
  const [detail, setDetail] = useState(null); // багажны id
  const [err, setErr] = useState("");

  const workerName = (id) => workers.find((w) => w.id === id)?.name || "—";
  const count = (s) => tools.filter((t) => t.status === s).length;
  const active = tools.filter((t) => t.status !== STATUS.RETIRED);

  const shown = tools.filter(
    (t) =>
      (filter === "all" ? t.status !== STATUS.RETIRED : t.status === filter) &&
      (!q || (t.name + " " + t.code).toLowerCase().includes(q.toLowerCase()))
  );

  const openForm = (t = emptyForm) => {
    setErr("");
    setDetail(null);
    setForm(t);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return setErr("Нэр болон кодоо бөглөнө үү");
    if (tools.some((t) => t.code === form.code.trim() && t.id !== form.id))
      return setErr("Энэ кодтой багаж бүртгэлтэй байна. Өөр код оруулна уу");
    await db.saveTool({ ...form, name: form.name.trim(), code: form.code.trim() });
    setForm(null);
    notify(form.id ? "Багаж шинэчлэгдлээ" : "Багаж бүртгэгдлээ");
    reload();
  };

  const retire = async (t) => {
    if (!confirm(`"${t.name}" багажийг актлах уу?`)) return;
    await db.saveTool({ ...t, status: STATUS.RETIRED, holderId: null });
    setDetail(null);
    notify("Багаж актлагдлаа");
    reload();
  };

  const remove = async (t) => {
    if (!confirm(`"${t.name}" багажийг бүртгэлээс устгах уу? Үүнийг буцаах боломжгүй.`)) return;
    await db.removeTool(t.id);
    setDetail(null);
    notify("Багаж устгагдлаа");
    reload();
  };

  const sendToRepair = async (t) => {
    const why = prompt("Эвдрэл эсвэл хийх ажлыг бичнэ үү");
    if (!why || !why.trim()) return;
    await db.startRepair(t.id, why.trim());
    setDetail(null);
    notify("Засварт шилжлээ");
    reload();
  };

  const current = tools.find((t) => t.id === detail);
  const toolLoans = current
    ? loans.filter((l) => l.toolId === current.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).slice(0, 5)
    : [];

  return (
    <>
      <PageHead
        title="Багаж"
        sub={`${active.length} багаж бүртгэлтэй`}
        action={
          <button className="btn primary" onClick={() => openForm()}>
            <Icon name="plus" size={20} /> Нэмэх
          </button>
        }
      />

      {tools.length > 0 && (
        <div className="panel fleet">
          <div className="fleet-total">
            <b>{active.length}</b>
            <span>идэвхтэй багаж</span>
          </div>
          <div className="fleet-bar" aria-hidden="true">
            {["available", "issued", "repair"].map((s) =>
              count(s) ? <span key={s} style={{ width: `${(count(s) / active.length) * 100}%`, background: BAR_COLORS[s] }} /> : null
            )}
          </div>
          <div className="filters">
            <button className={"filter" + (filter === "all" ? " on" : "")} onClick={() => setFilter("all")}>
              <b>{active.length}</b><small>Бүгд</small>
            </button>
            {["available", "issued", "repair"].map((s) => (
              <button key={s} className={"filter" + (filter === s ? " on" : "")} onClick={() => setFilter(filter === s ? "all" : s)}>
                <b>{count(s)}</b><small>{STATUS_LABEL[s]}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {tools.length > 0 && (
        <label className="search">
          <Icon name="search" size={20} />
          <input placeholder="Нэр эсвэл кодоор хайх" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Хайх" />
        </label>
      )}

      <div className="panel">
        {tools.length === 0 ? (
          <Empty title="Багаж бүртгэгдээгүй байна" hint="Эхний багажаа нэмээд код эсвэл barcode-г нь оруулна уу.">
            <button className="btn primary" onClick={() => openForm()}>
              <Icon name="plus" size={20} /> Багаж нэмэх
            </button>
          </Empty>
        ) : shown.length === 0 ? (
          <Empty title="Олдсонгүй" hint="Хайлт эсвэл шүүлтүүрээ өөрчилж үзнэ үү." />
        ) : (
          shown.map((t) => (
            <button key={t.id} className={`row-item stripe s-${t.status}`} onClick={() => setDetail(t.id)}>
              <div className="grow">
                <div className="row-name">{t.name}</div>
                <div className="row-sub">
                  {t.status === "issued" ? workerName(t.holderId) : [t.category, t.location].filter(Boolean).join(", ")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <CodeTag code={t.code} />
                <div style={{ marginTop: 4 }}><StatusText status={t.status} /></div>
              </div>
            </button>
          ))
        )}
      </div>

      {current && (
        <Sheet title={current.name} onClose={() => setDetail(null)}>
          <dl className="kv">
            <dt>Код</dt><dd><CodeTag code={current.code} /></dd>
            <dt>Төлөв</dt><dd><StatusText status={current.status} /></dd>
            {current.status === "issued" && (<><dt>Эзэмшигч</dt><dd>{workerName(current.holderId)}</dd></>)}
            <dt>Ангилал</dt><dd>{current.category || "—"}</dd>
            <dt>Байршил</dt><dd>{current.location || "—"}</dd>
            {current.note && (<><dt>Тэмдэглэл</dt><dd>{current.note}</dd></>)}
          </dl>

          {current.status === "available" && (
            <button className="btn primary block" style={{ marginBottom: 10 }} onClick={() => { setDetail(null); goIssue(); }}>
              <Icon name="swap" size={20} /> Олгох хэсэг рүү очих
            </button>
          )}
          <div className="form-actions" style={{ flexWrap: "wrap" }}>
            <button className="btn" onClick={() => openForm(current)}>Засах</button>
            {current.status === "available" && <button className="btn" onClick={() => sendToRepair(current)}>Засварт өгөх</button>}
          </div>
          {current.status !== "issued" && current.status !== "retired" && (
            <div className="form-actions">
              <button className="btn quiet" onClick={() => retire(current)}>Актлах</button>
              <button className="btn danger" onClick={() => remove(current)}>Устгах</button>
            </div>
          )}

          <h3 className="sub-title" style={{ marginTop: 18 }}>Сүүлийн олголтууд</h3>
          {toolLoans.length === 0 && <p className="row-sub">Одоогоор олгогдоогүй</p>}
          {toolLoans.map((l) => (
            <div className="log" key={l.id}>
              {workerName(l.workerId)}
              <small>
                {fmtDate(l.issuedAt)} → {l.returnedAt ? fmtDate(l.returnedAt) : "буцаагаагүй"}
              </small>
            </div>
          ))}
        </Sheet>
      )}

      {form && (
        <Sheet title={form.id ? "Багаж засах" : "Шинэ багаж"} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <div className="field">
              <label htmlFor="t-name">Нэр</label>
              <input id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Жишээ: Цахилгаан өрмийн машин" autoFocus />
            </div>
            <div className="field">
              <label>Код / barcode</label>
              <BarcodeScanner placeholder="Кодыг бичих эсвэл скан хийх" onScan={(v) => setForm({ ...form, code: v })} />
              {form.code && (
                <p className="msg ok"><Icon name="check" size={18} /> Код: {form.code}</p>
              )}
            </div>
            <div className="field">
              <label htmlFor="t-cat">Ангилал</label>
              <select id="t-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-loc">Байршил</label>
              <input id="t-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Агуулах, тавиурын дугаар" />
            </div>
            <div className="field">
              <label htmlFor="t-note">Тэмдэглэл</label>
              <textarea id="t-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            {err && <p className="msg error"><Icon name="alert" size={18} /> {err}</p>}
            <div className="form-actions">
              <button type="button" className="btn quiet" onClick={() => setForm(null)}>Болих</button>
              <button type="submit" className="btn primary">Хадгалах</button>
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
}
