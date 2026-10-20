import { useState } from "react";
import { db } from "../db/index.js";
import BarcodeScanner from "../components/BarcodeScanner.jsx";
import Sheet from "../components/Sheet.jsx";
import Icon from "../components/Icons.jsx";
import { Avatar, PageHead, Empty } from "../components/Bits.jsx";

const emptyForm = { name: "", position: "", badge: "" };

export default function Workers({ workers, tools, reload, notify }) {
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");

  const heldBy = (id) => tools.filter((t) => t.holderId === id && t.status === "issued").length;

  const openForm = (w = emptyForm) => {
    setErr("");
    setForm(w);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.badge.trim()) return setErr("Нэр болон үнэмлэхний barcode-г бөглөнө үү");
    if (workers.some((w) => w.badge === form.badge.trim() && w.id !== form.id))
      return setErr("Энэ barcode-той ажилтан бүртгэлтэй байна");
    await db.saveWorker({ ...form, name: form.name.trim(), badge: form.badge.trim() });
    setForm(null);
    notify(form.id ? "Ажилтан шинэчлэгдлээ" : "Ажилтан бүртгэгдлээ");
    reload();
  };

  const remove = async (w) => {
    if (heldBy(w.id)) return alert("Энэ ажилтанд багаж олгогдсон байна. Эхлээд багажийг буцаан авна уу.");
    if (!confirm(`${w.name}-г бүртгэлээс устгах уу?`)) return;
    await db.removeWorker(w.id);
    setForm(null);
    notify("Ажилтан устгагдлаа");
    reload();
  };

  return (
    <>
      <PageHead
        title="Ажилчид"
        sub={`${workers.length} ажилтан бүртгэлтэй`}
        action={
          <button className="btn primary" onClick={() => openForm()}>
            <Icon name="plus" size={20} /> Нэмэх
          </button>
        }
      />

      <div className="panel">
        {workers.length === 0 ? (
          <Empty title="Ажилтан бүртгэгдээгүй байна" hint="Үнэмлэхний barcode-той ажилтнаа нэмбэл багаж олгох боломжтой болно.">
            <button className="btn primary" onClick={() => openForm()}>
              <Icon name="plus" size={20} /> Ажилтан нэмэх
            </button>
          </Empty>
        ) : (
          workers.map((w) => (
            <button key={w.id} className="row-item" onClick={() => openForm(w)}>
              <Avatar name={w.name} />
              <div className="grow">
                <div className="row-name">{w.name}</div>
                <div className="row-sub">{w.position || "Албан тушаал бичигдээгүй"}</div>
              </div>
              <div className="row-sub" style={{ textAlign: "right" }}>
                {heldBy(w.id) ? `${heldBy(w.id)} багаж` : "Багажгүй"}
              </div>
              <span className="chev"><Icon name="chevron" size={18} /></span>
            </button>
          ))
        )}
      </div>

      {form && (
        <Sheet title={form.id ? "Ажилтан засах" : "Шинэ ажилтан"} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <div className="field">
              <label htmlFor="w-name">Овог нэр</label>
              <input id="w-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="w-pos">Албан тушаал</label>
              <input id="w-pos" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="field">
              <label>Үнэмлэхний barcode</label>
              <BarcodeScanner placeholder="Barcode бичих эсвэл скан хийх" onScan={(v) => setForm({ ...form, badge: v })} />
              {form.badge && <p className="msg ok"><Icon name="check" size={18} /> Barcode: {form.badge}</p>}
            </div>
            {err && <p className="msg error"><Icon name="alert" size={18} /> {err}</p>}
            <div className="form-actions">
              <button type="button" className="btn quiet" onClick={() => setForm(null)}>Болих</button>
              <button className="btn primary">Хадгалах</button>
            </div>
            {form.id && (
              <button type="button" className="btn danger block" style={{ marginTop: 10 }} onClick={() => remove(form)}>
                Бүртгэлээс устгах
              </button>
            )}
          </form>
        </Sheet>
      )}
    </>
  );
}
