import { localAdapter } from "./localAdapter.js";
import { deletePhoto } from "./photos.js";

// Дараа нь уурхайн database-тай холбохдоо зөвхөн энэ мөрийг солино.
const adapter = localAdapter;

// Толгой хэсгийн холболтын заагч болон мэдэгдэлд ашиглана.
export const connection = {
  mode: "local", // "local" | "remote"
  label: "Төхөөрөмж дээр",
  note: "Өгөгдөл энэ төхөөрөмжийн хөтөчид хадгалагдана.",
};

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export const STATUS = {
  AVAILABLE: "available", // бэлэн
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
  async removeTool(id) {
    await adapter.remove("tools", id);
    await deletePhoto(id).catch(() => {});
  },

  // Бүртгэлээс төлөв гараар солих (олгосон багажид хамаарахгүй).
  async changeStatus(toolId, status) {
    const tool = await adapter.get("tools", toolId);
    if (!tool || tool.status === status) return;
    if (tool.status === STATUS.ISSUED) throw new Error("Олгосон багажийг эхлээд буцаан авна уу");
    if (status === STATUS.REPAIR) {
      await db.startRepair(toolId, "Бүртгэлээс засварт шилжүүлсэн");
      return;
    }
    if (tool.status === STATUS.REPAIR) {
      const open = (await adapter.list("repairs")).find((r) => r.toolId === toolId && !r.finishedAt);
      if (open) await adapter.save("repairs", { ...open, finishedAt: now(), result: "Бүртгэлээс төлөв солисон", cost: null });
    }
    await adapter.save("tools", { ...tool, status, holderId: null });
  },

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
