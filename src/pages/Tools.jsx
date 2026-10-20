import { useEffect, useRef, useState } from "react";
import { db, connection } from "../db/index.js";
import { savePhoto, deletePhoto, getPhotoUrl, MAX_PHOTO_BYTES } from "../db/photos.js";
import { STATUS_LABEL, CATEGORIES, fmtLong } from "../hooks.js";
import BarcodeScanner from "../components/BarcodeScanner.jsx";
import Sheet from "../components/Sheet.jsx";
import Icon from "../components/Icons.jsx";
import { PageTitle, StatusPill, ToolThumb, SelectField, Pagination, paginate, Empty } from "../components/Bits.jsx";

const PER_PAGE = 7;
const emptyForm = { name: "", code: "", category: CATEGORIES[0], location: "", note: "", status: "available" };

export default function Tools({ tools, workers, loans, reload, notify, initialFilter = "all" }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null); // багажны id

  const workerName = (id) => workers.find((w) => w.id === id)?.name || "";

  const needle = q.trim().toLowerCase();
  const filtered = tools
    .filter((t) => filter === "all" || t.status === filter)
    .filter(
      (t) =>
        !needle ||
        [t.name, t.code, t.category, t.location, t.status === "issued" ? workerName(t.holderId) : ""]
          .join(" ")
          .toLowerCase()
          .includes(needle)
    )
    .sort((a, b) => a.name.localeCompare(b.name, "mn"));
  const pg = paginate(filtered, page, PER_PAGE);

  const current = tools.find((t) => t.id === detail);

  const remove = async (t) => {
    if (!confirm(`"${t.name}" багажийг бүртгэлээс устгах уу? Үүнийг буцаах боломжгүй.`)) return;
    await db.removeTool(t.id);
    setDetail(null);
    notify("Багаж устгагдлаа");
    reload();
  };

  return (
    <>
      <PageTitle
        eyebrow="Уурхайн агуулах"
        title="Багажны бүртгэл"
        sub="Багажийн бүртгэл, төлөвийг удирдана."
        action={
          <button className="btn primary" onClick={() => setForm(emptyForm)}>
            <Icon name="plus" size={20} /> Багаж нэмэх
          </button>
        }
      />

      <section className="card">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={20} />
            <input
              placeholder="Код, нэр, ангилал, эзэмшигчээр хайх"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              aria-label="Хайх"
            />
          </label>
          <div className="toolbar-row">
            <div className="select compact">
              <span className="select-ico"><Icon name="filter" size={20} /></span>
              <select
                className="has-ico"
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                aria-label="Төлвөөр шүүх"
              >
                <option value="all">Бүх төлөв</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <span className="select-chev"><Icon name="down" size={20} /></span>
            </div>
            <span className="count">{filtered.length} багаж</span>
          </div>
        </div>

        {tools.length === 0 ? (
          <Empty title="Багаж бүртгэгдээгүй байна" hint="Эхний багажаа нэмээд код эсвэл barcode-г нь оруулна уу.">
            <button className="btn primary" onClick={() => setForm(emptyForm)}>
              <Icon name="plus" size={20} /> Багаж нэмэх
            </button>
          </Empty>
        ) : filtered.length === 0 ? (
          <Empty title="Олдсонгүй" hint="Хайлт эсвэл шүүлтүүрээ өөрчилж үзнэ үү." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Багаж</th><th>Ангилал</th><th>Төлөв</th><th>Эзэмшигч</th></tr>
                </thead>
                <tbody>
                  {pg.rows.map((t) => (
                    <tr key={t.id} className="click" onClick={() => setDetail(t.id)}>
                      <td>
                        <div className="cell-tool">
                          <ToolThumb tool={t} />
                          <div>
                            <div className="cell-name">{t.name}</div>
                            <div className="cell-sub">{t.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="nowrap">{t.category || "—"}</td>
                      <td><StatusPill status={t.status} /></td>
                      <td className="nowrap">{t.status === "issued" ? workerName(t.holderId) || "—" : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} onPage={setPage} />
          </>
        )}
      </section>

      {current && (
        <ToolDetail
          tool={current}
          workerName={workerName(current.holderId)}
          loans={loans}
          workers={workers}
          onClose={() => setDetail(null)}
          onEdit={() => { setForm(current); setDetail(null); }}
          onRemove={() => remove(current)}
        />
      )}

      {form && (
        <ToolForm
          initial={form}
          tools={tools}
          onClose={() => setForm(null)}
          onSaved={(isNew) => {
            setForm(null);
            notify(isNew ? "Багаж бүртгэгдлээ" : "Багаж шинэчлэгдлээ");
            reload();
          }}
        />
      )}
    </>
  );
}

function ToolDetail({ tool, workerName, loans, workers, onClose, onEdit, onRemove }) {
  const [photo, setPhoto] = useState(null);
  useEffect(() => {
    let alive = true;
    if (tool.hasPhoto) getPhotoUrl(tool.id, tool.photoRev || 0).then((u) => alive && setPhoto(u)).catch(() => {});
    return () => { alive = false; };
  }, [tool.id, tool.hasPhoto, tool.photoRev]);

  const history = loans.filter((l) => l.toolId === tool.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).slice(0, 5);
  const wn = (id) => workers.find((w) => w.id === id)?.name || "—";

  return (
    <Sheet
      title={tool.name}
      onClose={onClose}
      footer={
        <>
          <button className="btn danger" onClick={onRemove} disabled={tool.status === "issued"}>Устгах</button>
          <button className="btn primary" onClick={onEdit}>Засах</button>
        </>
      }
    >
      {photo && <img className="sheet-photo" src={photo} alt={tool.name} />}
      <dl className="kv">
        <dt>Код</dt><dd>{tool.code}</dd>
        <dt>Төлөв</dt><dd><StatusPill status={tool.status} /></dd>
        {tool.status === "issued" && (<><dt>Эзэмшигч</dt><dd>{workerName || "—"}</dd></>)}
        <dt>Ангилал</dt><dd>{tool.category || "—"}</dd>
        <dt>Байршил</dt><dd>{tool.location || "—"}</dd>
        {tool.note && (<><dt>Тэмдэглэл</dt><dd>{tool.note}</dd></>)}
      </dl>
      <h3 className="sub-title">Сүүлийн олголтууд</h3>
      {history.length === 0 && <p className="muted">Одоогоор олгогдоогүй</p>}
      {history.map((l) => (
        <div className="log" key={l.id}>
          {wn(l.workerId)}
          <small>{fmtLong(l.issuedAt)} — {l.returnedAt ? fmtLong(l.returnedAt) : "буцаагаагүй"}</small>
        </div>
      ))}
    </Sheet>
  );
}

function ToolForm({ initial, tools, onClose, onSaved }) {
  const isNew = !initial.id;
  const [f, setF] = useState({ ...initial });
  const [wantStatus, setWantStatus] = useState(initial.status || "available");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Зураг: одоо байгаа, шинээр сонгосон, эсвэл устгах
  const [existingUrl, setExistingUrl] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [newUrl, setNewUrl] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const camRef = useRef();
  const pickRef = useRef();

  useEffect(() => {
    let alive = true;
    if (initial.hasPhoto) getPhotoUrl(initial.id, initial.photoRev || 0).then((u) => alive && setExistingUrl(u)).catch(() => {});
    return () => { alive = false; };
  }, [initial.id, initial.hasPhoto, initial.photoRev]);

  useEffect(() => () => newUrl && URL.revokeObjectURL(newUrl), [newUrl]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("Зөвхөн зураг сонгоно уу");
    if (file.size > MAX_PHOTO_BYTES) return setErr("Зураг 5 МБ-аас их байна");
    setErr("");
    setNewFile(file);
    setNewUrl(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const clearPhoto = () => {
    setNewFile(null);
    setNewUrl(null);
    setRemovePhoto(true);
  };

  const shownUrl = newUrl || (removePhoto ? null : existingUrl);
  const hasPhoto = !!newFile || (initial.hasPhoto && !removePhoto);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!f.name.trim() || !f.code.trim() || !f.category) return setErr("Код, нэр, ангилалыг бөглөнө үү");
    if (tools.some((t) => t.code === f.code.trim() && t.id !== f.id))
      return setErr("Энэ кодтой багаж бүртгэлтэй байна. Өөр код оруулна уу");
    setBusy(true);
    try {
      const { status: currentStatus, ...rest } = f;
      const saved = await db.saveTool({
        ...rest,
        status: isNew ? "available" : currentStatus,
        name: f.name.trim(),
        code: f.code.trim(),
      });
      let patch = null;
      if (newFile) {
        await savePhoto(saved.id, newFile);
        patch = { hasPhoto: true, photoRev: (saved.photoRev || 0) + 1 };
      } else if (removePhoto && saved.hasPhoto) {
        await deletePhoto(saved.id);
        patch = { hasPhoto: false };
      }
      if (patch) await db.saveTool({ ...saved, ...patch });
      if (wantStatus !== saved.status) await db.changeStatus(saved.id, wantStatus);
      onSaved(isNew);
    } catch (e2) {
      setErr(e2.message || "Хадгалж чадсангүй");
      setBusy(false);
    }
  };

  const issued = initial.status === "issued";

  return (
    <Sheet
      title={isNew ? "Багаж нэмэх" : "Багаж засах"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Болих</button>
          <button type="submit" form="tool-form" className="btn primary" disabled={busy}>
            <Icon name="check" size={20} /> {isNew ? "Бүртгэлд нэмэх" : "Хадгалах"}
          </button>
        </>
      }
    >
      <form id="tool-form" onSubmit={submit}>
        <div className="field">
          <div className="field-label">Код / barcode <span className="req">*</span></div>
          <BarcodeScanner placeholder="Кодыг бичих эсвэл скан хийх" onScan={(v) => setF({ ...f, code: v })} />
          {f.code && <p className="msg ok"><Icon name="check" size={18} /> Код: {f.code}</p>}
        </div>

        <div className="field">
          <label htmlFor="t-name">Нэр <span className="req">*</span></label>
          <input id="t-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Жишээ: Цахилгаан дрилл" />
        </div>

        <div className="field">
          <label htmlFor="t-cat">Ангилал <span className="req">*</span></label>
          <SelectField id="t-cat" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {[...new Set([...CATEGORIES, f.category].filter(Boolean))].map((c) => <option key={c}>{c}</option>)}
          </SelectField>
        </div>

        <div className="field">
          <label htmlFor="t-status">Төлөв</label>
          {issued ? (
            <>
              <div><StatusPill status="issued" /></div>
              <p className="help">Олгосон багажийн төлвийг "Багаж буцаах" хэсгээс өөрчилнө.</p>
            </>
          ) : (
            <SelectField id="t-status" value={wantStatus} onChange={(e) => setWantStatus(e.target.value)}>
              <option value="available">{STATUS_LABEL.available}</option>
              <option value="repair">{STATUS_LABEL.repair}</option>
              <option value="retired">{STATUS_LABEL.retired}</option>
            </SelectField>
          )}
        </div>

        <div className="field">
          <label htmlFor="t-loc">Байршил</label>
          <input id="t-loc" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Агуулах, тавиурын дугаар" />
        </div>

        <div className="photo-box">
          <div className="photo-head">
            <div>
              <b>Багажийн зураг</b>
              <small>Сонголттой, дээд хэмжээ 5 МБ</small>
            </div>
            {hasPhoto && <span className="pill s-available">Зураг хавсаргасан</span>}
          </div>
          {shownUrl ? (
            <img className="photo-preview" src={shownUrl} alt="Багажийн зураг" />
          ) : (
            <div className="photo-empty"><Icon name="image" size={32} /></div>
          )}
          <div className="photo-actions">
            <button type="button" className="btn" onClick={() => camRef.current.click()}>
              <Icon name="camera" size={20} /> Камераар зураг авах
            </button>
            <button type="button" className="btn" onClick={() => pickRef.current.click()}>
              <Icon name="image" size={20} /> {hasPhoto ? "Зураг солих" : "Зураг сонгох"}
            </button>
            {hasPhoto && (
              <button type="button" className="btn danger wide" onClick={clearPhoto}>
                <Icon name="trash" size={20} /> Зураг устгах
              </button>
            )}
          </div>
          <input ref={camRef} className="hidden-input" type="file" accept="image/*" capture="environment" onChange={onFile} />
          <input ref={pickRef} className="hidden-input" type="file" accept="image/*" onChange={onFile} />
          <p className="help">Зураг зөвхөн энэ төхөөрөмжийн хөтөчид хадгалагдана. Сервер рүү илгээгдэхгүй.</p>
        </div>

        <div className="field">
          <label htmlFor="t-note">Тэмдэглэл</label>
          <textarea id="t-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </div>

        {connection.mode === "local" && (
          <p className="note"><Icon name="help" size={20} /> {connection.note}</p>
        )}
        {err && <p className="msg error"><Icon name="alert" size={18} /> {err}</p>}
      </form>
    </Sheet>
  );
}
