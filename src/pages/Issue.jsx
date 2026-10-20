import { useState } from "react";
import { db } from "../db/index.js";
import { ago } from "../hooks.js";
import BarcodeScanner from "../components/BarcodeScanner.jsx";
import Icon from "../components/Icons.jsx";
import { Avatar, PageTitle, SelectField, ToolThumb, Empty } from "../components/Bits.jsx";

// mode="issue": Багаж олгох, mode="return": Багаж буцаах
export default function Issue({ mode, tools, workers, loans, reload, go }) {
  const isIssue = mode === "issue";
  const [worker, setWorker] = useState(null);
  const [result, setResult] = useState(null); // {type: ok|error, text}
  const [condition, setCondition] = useState("good");
  const [note, setNote] = useState("");

  const tool = (id) => tools.find((t) => t.id === id);
  const wn = (id) => workers.find((w) => w.id === id)?.name || "—";

  const open = loans.filter((l) => !l.returnedAt).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const held = worker ? open.filter((l) => l.workerId === worker.id) : [];

  const onWorkerScan = (badge) => {
    const w = workers.find((x) => x.badge === badge);
    if (w) {
      setWorker(w);
      setResult(null);
    } else {
      setWorker(null);
      setResult({ type: "error", text: `"${badge}" үнэмлэхтэй ажилтан бүртгэлгүй байна. Бусад → Ажилчид хэсэгт нэмнэ үү.` });
    }
  };

  const onToolScan = async (code) => {
    const t = tools.find((x) => x.code === code);
    if (!t) return setResult({ type: "error", text: `"${code}" кодтой багаж бүртгэлгүй байна.` });
    try {
      if (isIssue) {
        if (!worker) return setResult({ type: "error", text: "Эхлээд ажилтны үнэмлэхийг уншуулна уу." });
        await db.issueTool(t.id, worker.id, note);
        setResult({ type: "ok", text: `${t.name} олгогдлоо: ${worker.name}` });
        setNote("");
      } else {
        if (t.status !== "issued") return setResult({ type: "error", text: `${t.name} олгогдоогүй байна.` });
        await db.returnTool(t.id, condition);
        setResult({
          type: "ok",
          text: condition === "damaged" ? `${t.name} хүлээн авлаа. Засварт шилжүүллээ.` : `${t.name} хүлээн авлаа.`,
        });
      }
      reload();
    } catch (e) {
      setResult({ type: "error", text: e.message });
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="Уурхайн агуулах"
        title={isIssue ? "Багаж олгох" : "Багаж буцаах"}
        sub={isIssue ? "Ажилтны үнэмлэх болон багажны barcode-г уншуулна" : "Буцаж ирсэн багажны barcode-г уншуулна"}
      />

      {result && (
        <div className={"result " + result.type} role="status">
          <Icon name={result.type === "ok" ? "check" : "alert"} size={26} />
          {result.text}
        </div>
      )}

      {isIssue && (
        <section className="card step">
          <div className="step-head">
            <span className={"step-no" + (worker ? " done" : "")}>{worker ? <Icon name="check" size={16} /> : 1}</span>
            <h3>Ажилтан</h3>
          </div>
          {worker ? (
            <>
              <div className="holder">
                <Avatar name={worker.name} size={46} />
                <div className="grow">
                  <div className="cell-name">{worker.name}</div>
                  <div className="cell-sub">{worker.position || "Албан тушаал бичигдээгүй"}, {worker.badge}</div>
                </div>
                <button className="btn small" onClick={() => { setWorker(null); setResult(null); }}>Солих</button>
              </div>
              {held.length > 0 && (
                <p className="help">Одоо авсан байгаа: {held.map((l) => tool(l.toolId)?.name).filter(Boolean).join(", ")}</p>
              )}
            </>
          ) : (
            <BarcodeScanner placeholder="Үнэмлэхний barcode" onScan={onWorkerScan} />
          )}
        </section>
      )}

      <section className="card step">
        <div className="step-head">
          <span className="step-no">{isIssue ? 2 : 1}</span>
          <h3>Багаж</h3>
        </div>
        {isIssue ? (
          <div className="field">
            <label htmlFor="i-note">Тэмдэглэл</label>
            <input id="i-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Жишээ: 3-р уурхай, шөнийн ээлж" />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="i-cond">Буцаах үеийн төлөв</label>
            <SelectField id="i-cond" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="good">Хэвийн</option>
              <option value="damaged">Эвдэрсэн, засварт шилжүүлнэ</option>
            </SelectField>
          </div>
        )}
        <BarcodeScanner placeholder="Багажны код / barcode" onScan={onToolScan} />
      </section>

      <section className="card">
        <h2 className="card-title">Одоо олгогдсон ({open.length})</h2>
        {open.length === 0 ? (
          <Empty title="Олгогдсон багаж алга" hint="Олгосон багаж энд харагдана." />
        ) : (
          open.map((l) => {
            const t = tool(l.toolId);
            return (
              <div className="list-row" key={l.id}>
                {t && <ToolThumb tool={t} />}
                <div className="grow">
                  <div className="cell-name">{t?.name || "—"}</div>
                  <div className="cell-sub">{wn(l.workerId)}, {ago(l.issuedAt)}</div>
                </div>
                {!isIssue && t && (
                  <button className="btn small" onClick={() => onToolScan(t.code)}>Хүлээн авах</button>
                )}
              </div>
            );
          })
        )}
      </section>
    </>
  );
}
