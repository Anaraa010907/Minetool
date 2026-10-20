// Түр хадгалалт: хөтчийн localStorage.
// Уурхайн database-тай холбохдоо энэ файлтай ижил интерфэйстэй (list/get/save/remove)
// шинэ adapter бичээд src/db/index.js дотор солихад л хангалттай.

const PREFIX = "minetool:";

const read = (table) => {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + table) || "[]");
  } catch {
    return [];
  }
};
const write = (table, rows) => localStorage.setItem(PREFIX + table, JSON.stringify(rows));

export const localAdapter = {
  async list(table) {
    return read(table);
  },
  async get(table, id) {
    return read(table).find((r) => r.id === id) || null;
  },
  async save(table, row) {
    const rows = read(table);
    const i = rows.findIndex((r) => r.id === row.id);
    if (i >= 0) rows[i] = row;
    else rows.push(row);
    write(table, rows);
    return row;
  },
  async remove(table, id) {
    write(table, read(table).filter((r) => r.id !== id));
  },
};
