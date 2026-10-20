import { localAdapter } from "./localAdapter.js";

// Дараа нь уурхайн database-тай холбохдоо зөвхөн энэ мөрийг солино.
const adapter = localAdapter;

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export const STATUS = {
  AVAILABLE: "available", // агуулахад
  ISSUED: "issued", // олгосон
  REPAIR: "repair", // засварт
  RETIRED: "retired", // актласан
};

export const db = {
  // ---- Багаж ----
  tools: () => adapter.list("tools"),
  saveTool: (t) =>
    adapter.save("tools", {
      id: t.id || uid(),
      status: STATUS.AVAILABLE,
      createdAt: now(),
      ...t,
    }),
  removeTool: (id) => adapter.remove("tools", id),

  // ---- Ажилчид ----
  workers: () => adapter.list("workers"),
  saveWorker: (w) => adapter.save("workers", { id: w.id || uid(), createdAt: now(), ...w }),
  removeWorker: (id) => adapter.remove("workers", id),

  // ---- Олголт ----
  loans: () => adapter.list("loans"),

  async issueTool(toolId, workerId, note = "") {
    const tool = await adapter.get("tools", toolId);
    if (!tool) throw new Error("Багаж олдсонгүй");
    if (tool.status !== STATUS.AVAILABLE) throw new Error("Энэ багаж олгох боломжгүй байна");
    await adapter.save("tools", { ...tool, status: STATUS.ISSUED, holderId: workerId });
    return adapter.save("loans", {
      id: uid(),
      toolId,
      workerId,
      note,
      issuedAt: now(),
      returnedAt: null,
      returnCondition: null,
    });
  },

  async returnTool(toolId, condition = "good") {
    const tool = await adapter.get("tools", toolId);
    if (!tool) throw new Error("Багаж олдсонгүй");
    const loans = await adapter.list("loans");
    const open = loans.find((l) => l.toolId === toolId && !l.returnedAt);
    if (open) await adapter.save("loans", { ...open, returnedAt: now(), returnCondition: condition });
    const next = condition === "damaged" ? STATUS.REPAIR : STATUS.AVAILABLE;
    await adapter.save("tools", { ...tool, status: next, holderId: null });
    if (condition === "damaged") {
      await db.startRepair(toolId, "Буцаахад эвдэрсэн байсан");
    }
  },

  // ---- Засвар, үйлчилгээ ----
  repairs: () => adapter.list("repairs"),

  async startRepair(toolId, description) {
    const tool = await adapter.get("tools", toolId);
    if (!tool) throw new Error("Багаж олдсонгүй");
    await adapter.save("tools", { ...tool, status: STATUS.REPAIR, holderId: null });
    return adapter.save("repairs", {
      id: uid(),
      toolId,
      description,
      startedAt: now(),
      finishedAt: null,
      cost: null,
      result: null,
    });
  },

  async finishRepair(repairId, { result, cost }) {
    const repair = await adapter.get("repairs", repairId);
    if (!repair) throw new Error("Засвар олдсонгүй");
    await adapter.save("repairs", {
      ...repair,
      finishedAt: now(),
      result,
      cost: cost === "" || cost == null ? null : Number(cost),
    });
    const tool = await adapter.get("tools", repair.toolId);
    if (tool) await adapter.save("tools", { ...tool, status: STATUS.AVAILABLE, holderId: null });
  },
};
