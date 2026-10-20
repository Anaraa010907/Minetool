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

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" }) : "—";

export const daysSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

export const STATUS_LABEL = {
  available: "Агуулахад",
  issued: "Олгосон",
  repair: "Засварт",
  retired: "Актласан",
};
