import { useState } from "react";
import { db, STATUS } from "../db/index.js";
import { STATUS_LABEL } from "../hooks.js";
import BarcodeScanner from "../components/BarcodeScanner.jsx";

const CATEGORIES = ["Гар багаж", "Цахилгаан багаж", "Хэмжих хэрэгсэл", "Аюулгүй байдал", "Бусад"];
const empty = { name: "", code: "", category: CATEGORIES[0], location: "", note: "" };

export default function Tools({ tools, workers, reload }) {
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const workerName = (id) => workers.find((w) => w.id === id)?.name || "—";

  const shown = tools.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      (!q || (t.name + " " + t.code).toLowerCase().includes(q.toLowerCase()))
  );

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.name.trim() || !form.code.trim()) return setErr("Нэр болон кодыг заавал бөглөнө үү");
    const dup = tools.find((t) => t.code === form.code.trim() && t.id !== form.id);
    if (dup) return setErr("Энэ кодтой багаж аль хэдийн бүртгэлтэй байна");
    await db.saveTool({ ...form, name: form.name.trim(), code: form.code.trim() });
    setForm(null);
    reload();
  };

  const retire = async (t) => {
    if (!confirm(`"${t.name}" багажийг актлах уу?`)) return;
    await db.saveTool({ ...t, status: STATUS.RETIRED, holderId: null });
    reload();
  };

  const remove = async (t) => {
    if (!confirm(`"${t.name}" багажийг бүртгэлээс устгах уу?`)) return;
    await db.removeTool(t.id);
    reload();
  };

  return (
    <>
      <div className="stats">
        <div className="stat"><b>{tools.length}</b><span>Нийт багаж</span></div>
        <div className="stat"><b>{tools.filter((t) => t.status === "available").length}</b><span>Агуулахад</span></div>
        <div className="stat"><b>{tools.filter((t) => t.status === "issued").length}</b><span>Олгосон</span></div>
        <div className="stat"><b>{tools.filter((t) => t.status === "repair").length}</b><span>Засварт</span></div>
      </div>

      {form ? (
        <form className="card" onSubmit={save}>
          <h2>{form.id ? "Багаж засах" : "Шинэ багаж бүртгэх"}</h2>
          <label>Нэр *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label>Код / Barcode *</label>
          <BarcodeScanner
            placeholder="Кодыг бичих эсвэл скан хийх"
            onScan={(v) => setForm({ ...form, code: v })}
          />
          {form.code && <p className="ok">Код: {form.code}</p>}
          <label>Ангилал</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label>Байршил (агуулах, тавиур)</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <label>Тэмдэглэл</label>
          <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          {err && <p className="error">{err}</p>}
          <div className="row" style={{ marginTop: 12 }}>
            <button type="submit" className="btn gold">Хадгалах</button>
            <button type="button" className="btn" onClick={() => setForm(null)}>Болих</button>
          </div>
        </form>
      ) : (
        <button className="btn gold block" style={{ marginTop: 0, marginBottom: 12 }} onClick={() => setForm(empty)}>
          + Шинэ багаж нэмэх
        </button>
      )}

      <div className="card">
        <input placeholder="Нэр эсвэл кодоор хайх" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips" style={{ marginTop: 10 }}>
          {[["all", "Бүгд"], ...Object.entries(STATUS_LABEL)].map(([k, v]) => (
            <button key={k} className={"chip" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>{v}</button>
          ))}
        </div>
        {shown.length === 0 && <div className="empty">Багаж олдсонгүй</div>}
        {shown.map((t) => (
          <div className="item" key={t.id}>
            <div>
              <div className="name">{t.name}</div>
              <div className="sub">
                {t.code} · {t.category}
                {t.location ? ` · ${t.location}` : ""}
                {t.status === "issued" ? ` · ${workerName(t.holderId)}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className={"badge " + t.status}>{STATUS_LABEL[t.status]}</span>
              <div className="row" style={{ marginTop: 6, justifyContent: "flex-end" }}>
                <button className="btn small" onClick={() => setForm(t)}>Засах</button>
                {t.status === "available" && <button className="btn small" onClick={() => retire(t)}>Актлах</button>}
                {t.status !== "issued" && <button className="btn small" onClick={() => remove(t)}>🗑</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
