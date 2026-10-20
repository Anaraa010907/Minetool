import { useState } from "react";
import { db } from "../db/index.js";
import { fmtDate } from "../hooks.js";
import BarcodeScanner from "../components/BarcodeScanner.jsx";

export default function Issue({ tools, workers, loans, reload }) {
  const [mode, setMode] = useState("issue"); // issue | return
  const [worker, setWorker] = useState(null);
  const [unknownBadge, setUnknownBadge] = useState("");
  const [msg, setMsg] = useState(null); // {type, text}
  const [condition, setCondition] = useState("good");
  const [note, setNote] = useState("");

  const say = (type, text) => setMsg({ type, text });
  const toolByCode = (code) => tools.find((t) => t.code === code);

  const onWorkerScan = (badge) => {
    setMsg(null);
    const w = workers.find((x) => x.badge === badge);
    if (w) {
      setWorker(w);
      setUnknownBadge("");
    } else {
      setWorker(null);
      setUnknownBadge(badge);
      say("error", `"${badge}" дугаартай ажилтан бүртгэлгүй байна. "Ажилчид" хэсгээс нэмнэ үү.`);
    }
  };

  const onToolScan = async (code) => {
    setMsg(null);
    const tool = toolByCode(code);
    if (!tool) return say("error", `"${code}" кодтой багаж бүртгэлгүй байна`);
    try {
      if (mode === "issue") {
        if (!worker) return say("error", "Эхлээд ажилтны үнэмлэхийг уншуулна уу");
        await db.issueTool(tool.id, worker.id, note);
        say("ok", `✔ ${tool.name} → ${worker.name}`);
        setNote("");
      } else {
        if (tool.status !== "issued") return say("error", `${tool.name} олгогдоогүй байна`);
        await db.returnTool(tool.id, condition);
        say("ok", condition === "damaged" ? `✔ ${tool.name} хүлээн авлаа (засварт шилжүүллээ)` : `✔ ${tool.name} хүлээн авлаа`);
      }
      reload();
    } catch (e) {
      say("error", e.message);
    }
  };

  const open = loans
    .filter((l) => !l.returnedAt)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const history = loans.filter((l) => l.returnedAt).sort((a, b) => b.returnedAt.localeCompare(a.returnedAt)).slice(0, 15);
  const wn = (id) => workers.find((w) => w.id === id)?.name || "—";
  const tn = (id) => tools.find((t) => t.id === id)?.name || "—";
  const myTools = worker ? open.filter((l) => l.workerId === worker.id) : [];

  return (
    <>
      <div className="chips">
        <button className={"chip" + (mode === "issue" ? " active" : "")} onClick={() => { setMode("issue"); setMsg(null); }}>Олгох</button>
        <button className={"chip" + (mode === "return" ? " active" : "")} onClick={() => { setMode("return"); setMsg(null); }}>Хүлээн авах</button>
      </div>

      {mode === "issue" && (
        <div className="card">
          <h2>1. Ажилтны үнэмлэх</h2>
          <BarcodeScanner placeholder="Үнэмлэхний barcode" onScan={onWorkerScan} />
          {worker && (
            <>
              <p className="ok">👷 {worker.name}{worker.position ? ` · ${worker.position}` : ""}</p>
              {myTools.length > 0 && (
                <p className="hint">Одоо авсан байгаа: {myTools.map((l) => tn(l.toolId)).join(", ")}</p>
              )}
            </>
          )}
          {unknownBadge && !worker && <p className="hint">Уншсан дугаар: {unknownBadge}</p>}
        </div>
      )}

      <div className="card">
        <h2>{mode === "issue" ? "2. Багажны код" : "Багажны код"}</h2>
        {mode === "issue" ? (
          <>
            <label>Тэмдэглэл (заавал биш)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Жишээ: 3-р уурхай, шөнийн ээлж" />
          </>
        ) : (
          <>
            <label>Багажны төлөв</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="good">Хэвийн</option>
              <option value="damaged">Эвдэрсэн (засварт шилжүүлнэ)</option>
            </select>
          </>
        )}
        <div style={{ marginTop: 10 }}>
          <BarcodeScanner placeholder="Багажны barcode / код" onScan={onToolScan} />
        </div>
        {msg && <p className={msg.type}>{msg.text}</p>}
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Олгогдсон багаж ({open.length})</h2>
          {open.length === 0 && <div className="empty">Олгогдсон багаж алга</div>}
          {open.map((l) => (
            <div className="item" key={l.id}>
              <div>
                <div className="name">{tn(l.toolId)}</div>
                <div className="sub">{wn(l.workerId)} · {fmtDate(l.issuedAt)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h2>Сүүлийн буцаалтууд</h2>
          {history.length === 0 && <div className="empty">Түүх алга</div>}
          {history.map((l) => (
            <div className="item" key={l.id}>
              <div>
                <div className="name">{tn(l.toolId)}</div>
                <div className="sub">{wn(l.workerId)} · {fmtDate(l.returnedAt)}{l.returnCondition === "damaged" ? " · эвдэрсэн" : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
