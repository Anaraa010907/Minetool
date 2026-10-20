import { useCallback, useEffect, useState } from "react";
import { db } from "./db/index.js";

// Бүх хүснэгтийг нэг дор уншиж, өөрчлөлтийн дараа дахин ачаална.
export function useData() {
  const [data, setData] = useState({ tools: [], workers: [], loans: [], repairs: [] });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [tools, workers, loans, repairs] = await Promise.all([
      db.tools(),
      db.workers(),
      db.loans(),
      db.repairs(),
    ]);
    setData({ tools, workers, loans, repairs });
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...data, loading, reload };
}

const pad = (n) => String(n).padStart(2, "0");

// "2026 оны 10-р сарын 13 08:42"
export const fmtLong = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// "10-р сарын 13, 08:42"
export const fmtShort = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}-р сарын ${d.getDate()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const daysSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

export const STATUS_LABEL = {
  available: "Бэлэн",
  issued: "Олгосон",
  repair: "Засварт",
  retired: "Актласан",
};

export const CATEGORIES = ["Гар багаж", "Цахилгаан багаж", "Өрмийн багаж", "Гагнуур", "Хэмжих хэрэгсэл", "Аюулгүй байдал", "Бусад"];

// Олголт бүрээс "Олголт" ба "Буцаалт" үйл явдал үүсгэнэ (шинэ нь эхэндээ).
export const buildEvents = (loans) => {
  const ev = [];
  for (const l of loans) {
    ev.push({ id: l.id + ":out", at: l.issuedAt, type: "out", toolId: l.toolId, workerId: l.workerId, note: l.note });
    if (l.returnedAt)
      ev.push({ id: l.id + ":in", at: l.returnedAt, type: "in", toolId: l.toolId, workerId: l.workerId, condition: l.returnCondition });
  }
  return ev.sort((a, b) => b.at.localeCompare(a.at));
};

// "3 өдөр", "5 цаг", "Дөнгөж сая"
export const ago = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Дөнгөж сая";
  if (mins < 60) return `${mins} минутын өмнө`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} цагийн өмнө`;
  return `${Math.floor(h / 24)} өдрийн өмнө`;
};
