export type ToolStatus = 'available' | 'issued' | 'overdue' | 'damaged' | 'lost' | 'maintenance' | 'retired'
export type Condition = 'good' | 'damaged' | 'maintenance'
export type Employee = { id: string; name: string; department: string; position: string; barcode: string; active: boolean }
export type ToolItem = { id: string; code: string; name: string; category: string; status: ToolStatus; holderId?: string; photoKey?: string }
export type EventRecord = { id: number; type: 'Олголт' | 'Буцаалт'; date: string; employeeId: string; toolIds: string[]; condition?: string }
export type RepairRecord = { id: number; toolId: string; kind: string; note: string; date: string; status: 'open' | 'done'; doneDate?: string }

export const repairKinds = ['Механик гэмтэл', 'Цахилгааны гэмтэл', 'Элэгдэл / үйлчилгээ', 'Бусад']

export const statusLabels: Record<ToolStatus, string> = {
  available: 'Бэлэн', issued: 'Олгосон', overdue: 'Хугацаа хэтэрсэн', damaged: 'Гэмтэлтэй', lost: 'Алдагдсан', maintenance: 'Засварт', retired: 'Ашиглалтаас хассан',
}
export const statusOrder: ToolStatus[] = ['available', 'issued', 'overdue', 'maintenance', 'damaged', 'lost', 'retired']
export const conditionLabels: Record<Condition, string> = { good: 'Хэвийн', damaged: 'Гэмтэлтэй', maintenance: 'Засвар шаардлагатай' }

const weekdays = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']
const pad = (value: number) => String(value).padStart(2, '0')

// Төхөөрөмжийн хэлний тохиргооноос үл хамааран нэг ижил хэлбэрээр харуулна.
export const dayKey = (date: string | Date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export const timeLabel = (date: string) => { const d = new Date(date); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
export const shortDate = (date: string) => { const d = new Date(date); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}` }
export const dateLabel = (date: string) => `${shortDate(date)} ${timeLabel(date)}`
export const dayHeading = (date: string) => { const d = new Date(date); return `${d.getMonth() + 1}-р сарын ${d.getDate()}, ${weekdays[d.getDay()]}` }
export const todayHeading = () => {
  const d = new Date()
  return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}, ${weekdays[d.getDay()]} гараг`
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('')

export const isRepair = (value: unknown): value is RepairRecord => {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'number' && typeof v.toolId === 'string' && typeof v.kind === 'string' && typeof v.note === 'string'
    && typeof v.date === 'string' && !Number.isNaN(Date.parse(v.date)) && (v.status === 'open' || v.status === 'done')
    && (v.doneDate === undefined || typeof v.doneDate === 'string')
}
