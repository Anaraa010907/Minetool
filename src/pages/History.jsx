import { useState } from "react";
import { buildEvents, fmtLong } from "../hooks.js";
import Icon from "../components/Icons.jsx";
import { PageTitle, Pagination, paginate, Empty } from "../components/Bits.jsx";

const PER_PAGE = 10;

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function History({ tools, workers, loans, onBack, notify }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const tool = (id) => tools.find((t) => t.id === id);
  const worker = (id) => workers.find((w) => w.id === id);

  const needle = q.trim().toLowerCase();
  const fromMs = from ? new Date(from + "T00:00:00").getTime() : null;
  const toMs = to ? new Date(to + "T23:59:59").getTime() : null;

  const rows = buildEvents(loans).filter((e) => {
    if (type !== "all" && e.type !== type) return false;
    const ms = new Date(e.at).getTime();
    if (fromMs && ms < fromMs) return false;
    if (toMs && ms > toMs) return false;
    if (!needle) return true;
    const t = tool(e.toolId);
    const w = worker(e.workerId);
    return [t?.name, t?.code, w?.name, w?.badge].join(" ").toLowerCase().includes(needle);
  });
  const pg = paginate(rows, page, PER_PAGE);

  const reset = (fn) => (e) => {
    fn(e.target.value);
    setPage(1);
  };

  const exportCsv = () => {
    if (rows.length === 0) return notify("Экспортлох бүртгэл алга");
    const head = ["Огноо", "Үйл явдал", "Ажилтан", "Үнэмлэхний дугаар", "Багаж", "Багажны код", "Тэмдэглэл"];
    const lines = rows.map((e) => {
      const t = tool(e.toolId);
      const w = worker(e.workerId);
      const note = e.type === "out" ? e.note : e.condition === "damaged" ? "Эвдэрсэн" : "Хэвийн";
      return [fmtLong(e.at), e.type === "out" ? "Олголт" : "Буцаалт", w?.name, w?.badge, t?.name, t?.code, note].map(csvCell).join(",");
    });
    const blob = new Blob(["﻿" + [head.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minetool-tuuh-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("CSV файл татагдлаа");
  };

  return (
    <>
      <PageTitle title="Түүх ба тайлан" sub="Олголт, буцаалтын үйл ажиллагааны тайлан" onBack={onBack} />

      <section className="card">
        <div className="toolbar" style={{ paddingBottom: 18 }}>
          <label className="search">
            <Icon name="search" size={20} />
            <input placeholder="Ажилтан эсвэл багажны код" value={q} onChange={reset(setQ)} aria-label="Хайх" />
          </label>
          <div className="select">
            <span className="select-ico"><Icon name="filter" size={20} /></span>
            <select className="has-ico" value={type} onChange={reset(setType)} aria-label="Үйл явдлаар шүүх">
              <option value="all">Бүх үйл явдал</option>
              <option value="out">Олголт</option>
              <option value="in">Буцаалт</option>
            </select>
            <span className="select-chev"><Icon name="down" size={20} /></span>
          </div>
          <div className="date-row">
            <input type="date" value={from} onChange={reset(setFrom)} aria-label="Эхлэх огноо" />
            <input type="date" value={to} onChange={reset(setTo)} aria-label="Дуусах огноо" />
          </div>
          <button className="btn block" onClick={exportCsv}>
            <Icon name="download" size={20} /> CSV экспорт
          </button>
        </div>

        <div className="summary">
          <Icon name="pulse" size={22} />
          <span>Шүүлтэд тохирсон <b>{rows.length}</b> бүртгэл</span>
        </div>

        {rows.length === 0 ? (
          <Empty title="Бүртгэл олдсонгүй" hint="Шүүлтүүрээ өөрчилж үзнэ үү. Олголт хийгдсэний дараа түүх энд харагдана." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Огноо, цаг</th><th>Үйл явдал</th><th>Ажилтан</th><th>Багаж</th></tr>
                </thead>
                <tbody>
                  {pg.rows.map((e) => {
                    const t = tool(e.toolId);
                    const w = worker(e.workerId);
                    return (
                      <tr key={e.id}>
                        <td className="nowrap">{fmtLong(e.at)}</td>
                        <td>
                          <span className={"act " + e.type}>
                            <Icon name={e.type === "out" ? "download" : "swap"} size={20} />
                            {e.type === "out" ? "Олголт" : "Буцаалт"}
                          </span>
                          {e.type === "in" && e.condition === "damaged" && <div className="cell-sub">Эвдэрсэн</div>}
                        </td>
                        <td className="nowrap">
                          <div className="cell-name">{w?.name || "—"}</div>
                          <div className="cell-sub">{w?.badge || ""}</div>
                        </td>
                        <td className="nowrap">
                          <div className="cell-name">{t?.name || "—"}</div>
                          <div className="cell-sub">{t?.code || ""}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} onPage={setPage} />
          </>
        )}
      </section>
    </>
  );
}
