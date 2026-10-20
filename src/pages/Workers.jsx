import { useState } from "react";
import { db } from "../db/index.js";
import BarcodeScanner from "../components/BarcodeScanner.jsx";

const empty = { name: "", position: "", badge: "" };

export default function Workers({ workers, tools, reload }) {
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");

  const heldBy = (id) => tools.filter((t) => t.holderId === id && t.status === "issued").length;

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.name.trim() || !form.badge.trim()) return setErr("Нэр болон үнэмлэхний barcode-г бөглөнө үү");
    if (workers.some((w) => w.badge === form.badge.trim() && w.id !== form.id))
      return setErr("Энэ barcode-той ажилтан аль хэдийн бүртгэлтэй");
    await db.saveWorker({ ...form, name: form.name.trim(), badge: form.badge.trim() });
    setForm(null);
    reload();
  };

  const remove = async (w) => {
    if (heldBy(w.id)) return alert("Энэ ажилтанд багаж олгогдсон байна. Эхлээд буцаан авна уу.");
    if (!confirm(`${w.name}-г устгах уу?`)) return;
    await db.removeWorker(w.id);
    reload();
  };

  return (
    <>
      {form ? (
        <form className="card" onSubmit={save}>
          <h2>{form.id ? "Ажилтан засах" : "Шинэ ажилтан"}</h2>
          <label>Овог нэр *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label>Албан тушаал</label>
          <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <label>Үнэмлэхний barcode *</label>
          <BarcodeScanner placeholder="Barcode бичих эсвэл скан хийх" onScan={(v) => setForm({ ...form, badge: v })} />
          {form.badge && <p className="ok">Barcode: {form.badge}</p>}
          {err && <p className="error">{err}</p>}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn gold">Хадгалах</button>
            <button type="button" className="btn" onClick={() => setForm(null)}>Болих</button>
          </div>
        </form>
      ) : (
        <button className="btn gold block" style={{ marginTop: 0, marginBottom: 12 }} onClick={() => setForm(empty)}>
          + Ажилтан нэмэх
        </button>
      )}

      <div className="card">
        <h2>Ажилчид ({workers.length})</h2>
        {workers.length === 0 && <div className="empty">Ажилтан бүртгэгдээгүй байна</div>}
        {workers.map((w) => (
          <div className="item" key={w.id}>
            <div>
              <div className="name">{w.name}</div>
              <div className="sub">{w.position || "—"} · {w.badge} · багаж: {heldBy(w.id)}</div>
            </div>
            <div className="row">
              <button className="btn small" onClick={() => setForm(w)}>Засах</button>
              <button className="btn small" onClick={() => remove(w)}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
