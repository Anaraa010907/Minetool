import { useState } from "react";
import { db } from "../db/index.js";
import { fmtDate } from "../hooks.js";
import BarcodeScanner from "../components/BarcodeScanner.jsx";
import Icon from "../components/Icons.jsx";
import { Avatar, PageHead, Empty } from "../components/Bits.jsx";

export default function Issue({ tools, workers, loans, reload }) {
  const [mode, setMode] = useState("issue"); // issue | return
  const [worker, setWorker] = useState(null);
  const [result, setResult] = useState(null); // {type: ok|error, text}
  const [condition, setCondition] = useState("good");
  const [note, setNote] = useState("");

  const wn = (id) => workers.find((w) => w.id === id)?.name || "—";
  const tn = (id) => tools.find((t) => t.id === id)?.name || "—";

  const open = loans.filter((l) => !l.returnedAt).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const history = loans.filter((l) => l.returnedAt).sort((a, b) => b.returnedAt.localeCompare(a.returnedAt)).slice(0, 10);
  const held = worker ? open.filter((l) => l.workerId === worker.id) : [];

  const switchMode = (m) => {
    setMode(m);
    setResult(null);
  };

  const onWorkerScan = (badge) => {
    const w = workers.find((x) => x.badge === badge);
    if (w) {
      setWorker(w);
      setResult(null);
    } else {
      setWorker(null);
      setResult({ type: "error", text: `"${badge}" үнэмлэхтэй ажилтан бүртгэлгүй байна. "Ажилчид" хэсэгт нэмнэ үү.` });
    }
  };

  const onToolScan = async (code) => {
    const tool = tools.find((t) => t.code === code);
    if (!tool) return setResult({ type: "error", text: `"${code}" кодтой багаж бүртгэлгүй байна.` });
    try {
      if (mode === "issue") {
        if (!worker) return setResult({ type: "error", text: "Эхлээд ажилтны үнэмлэхийг уншуулна уу." });
        await db.issueTool(tool.id, worker.id, note);
        setResult({ type: "ok", text: `${tool.name} олгогдлоо → ${worker.name}` });
        setNote("");
      } else {
        if (tool.status !== "issued") return setResult({ type: "error", text: `${tool.name} олгогдоогүй байна.` });
        await db.returnTool(tool.id, condition);
        setResult({
          type: "ok",
          text: condition === "damaged" ? `${tool.name} хүлээн авлаа. Засварт шилжүүллээ.` : `${tool.name} хүлээн авлаа`,
        });
      }
      reload();
    } catch (e) {
      setResult({ type: "error", text: e.message });
    }
  };

  return (
    <>
      <PageHead title="Олгох / Авах" sub="Үнэмлэх болон багажны barcode-г уншуулна" />

      <div className="segment" role="tablist">
        <button role="tab" aria-selected={mode === "issue"} className={mode === "issue" ? "on" : ""} onClick={() => switchMode("issue")}>Олгох</button>
        <button role="tab" aria-selected={mode === "return"} className={mode === "return" ? "on" : ""} onClick={() => switchMode("return")}>Хүлээн авах</button>
      </div>

      {result && (
        <div className={"result " + result.type} role="status">
          <span className="ico"><Icon name={result.type === "ok" ? "check" : "alert"} size={26} /></span>
          {result.text}
        </div>
      )}

      {mode === "issue" && (
        <div className="panel step">
          <div className="step-head">
            <span className={"step-no" + (worker ? " done" : "")}>{worker ? <Icon name="check" size={15} /> : 1}</span>
            <h3>Ажилтан</h3>
          </div>
          {worker ? (
            <>
              <div className="holder">
                <Avatar name={worker.name} />
                <div className="grow">
                  <div className="row-name">{worker.name}</div>
                  <div className="row-sub">{worker.position || "Албан тушаал бичигдээгүй"}</div>
                </div>
                <button className="btn small quiet" onClick={() => { setWorker(null); setResult(null); }}>Солих</button>
              </div>
              {held.length > 0 && (
                <p className="row-sub" style={{ whiteSpace: "normal", marginTop: 10 }}>
                  Одоо авсан байгаа: {held.map((l) => tn(l.toolId)).join(", ")}
                </p>
              )}
            </>
          ) : (
            <BarcodeScanner placeholder="Үнэмлэхний barcode" onScan={onWorkerScan} />
          )}
        </div>
      )}

      <div className="panel step">
        <div className="step-head">
          <span className="step-no">{mode === "issue" ? 2 : 1}</span>
          <h3>Багаж</h3>
        </div>
        {mode === "issue" ? (
          <div className="field">
            <label htmlFor="i-note">Тэмдэглэл</label>
            <input id="i-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Жишээ: 3-р уурхай, шөнийн ээлж" />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="i-cond">Буцаах үеийн төлөв</label>
            <select id="i-cond" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="good">Хэвийн</option>
              <option value="damaged">Эвдэрсэн, засварт шилжүүлнэ</option>
            </select>
          </div>
        )}
        <BarcodeScanner placeholder="Багажны код / barcode" onScan={onToolScan} />
      </div>

      <div className="panel">
        <h3 className="panel-title">Одоо олгогдсон ({open.length})</h3>
        {open.length === 0 ? (
          <Empty title="Олгогдсон багаж алга" hint="Олгосон багаж энд харагдана." />
        ) : (
          open.map((l) => (
            <div className="row-item plain" key={l.id}>
              <Avatar name={wn(l.workerId)} />
              <div className="grow">
                <div className="row-name">{tn(l.toolId)}</div>
                <div className="row-sub">{wn(l.workerId)}, {fmtDate(l.issuedAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {history.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Сүүлд буцаасан</h3>
          {history.map((l) => (
            <div className="row-item plain" key={l.id}>
              <div className="grow">
                <div className="row-name">{tn(l.toolId)}</div>
                <div className="row-sub">
                  {wn(l.workerId)}, {fmtDate(l.returnedAt)}
                  {l.returnCondition === "damaged" ? ", эвдэрсэн" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
