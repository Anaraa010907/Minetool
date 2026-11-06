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
export const conditionLabels: Record<Condition, string> = { good: 'Хэвийн', damaged: 'Гэмтэлтэй', maintenance: 'Засвар шаардлагатай' }

export const dateLabel = (date: string) => new Intl.DateTimeFormat('mn-MN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
export const timeLabel = (date: string) => new Intl.DateTimeFormat('mn-MN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date))
export const dayLabel = (date: string) => new Intl.DateTimeFormat('mn-MN', { month: '2-digit', day: '2-digit' }).format(new Date(date))

export const isRepair = (value: unknown): value is RepairRecord => {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'number' && typeof v.toolId === 'string' && typeof v.kind === 'string' && typeof v.note === 'string'
    && typeof v.date === 'string' && !Number.isNaN(Date.parse(v.date)) && (v.status === 'open' || v.status === 'done')
    && (v.doneDate === undefined || typeof v.doneDate === 'string')
}
