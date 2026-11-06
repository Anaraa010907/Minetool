import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDownToLine, ArrowLeftRight, Bell, Clock3, Cloud, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { dateLabel, statusLabels } from '../lib/shared'
import type { Employee, EventRecord, ToolItem } from '../lib/shared'

export type NotifyTarget = 'return' | 'inventory' | 'repair' | 'sync' | 'history'
type Tone = 'red' | 'orange' | 'green' | 'blue'
type Notice = { id: string; tone: Tone; icon: LucideIcon; title: string; text: string; date?: string; attention: boolean; go: NotifyTarget }

export default function NotificationsView({ tools, events, employees, pendingCount, onGo }: {
  tools: ToolItem[]
  events: EventRecord[]
  employees: Employee[]
  pendingCount: number
  onGo: (target: NotifyTarget) => void
}) {
  const [tab, setTab] = useState<'all' | 'attention'>('all')

  const notices = useMemo(() => {
    const person = (id?: string) => employees.find((employee) => employee.id === id)?.name ?? ''
    const lastIssue = (toolId: string) => events.find((event) => event.type === 'Олголт' && event.toolIds.includes(toolId))
    const list: Notice[] = []
    tools.filter((tool) => tool.status === 'overdue').forEach((tool) => list.push({
      id: `o-${tool.id}`, tone: 'red', icon: Clock3, attention: true, go: 'return',
      title: 'Буцаах хугацаа хэтэрсэн', text: `${tool.name} · ${tool.code}${tool.holderId ? ` · ${person(tool.holderId)}` : ''}`, date: lastIssue(tool.id)?.date,
    }))
    tools.filter((tool) => tool.status === 'damaged' || tool.status === 'lost').forEach((tool) => list.push({
      id: `d-${tool.id}`, tone: 'red', icon: AlertTriangle, attention: true, go: 'inventory',
      title: tool.status === 'lost' ? 'Багаж алдагдсан' : 'Багаж гэмтсэн', text: `${tool.name} · ${tool.code} · ${statusLabels[tool.status]}`,
    }))
    tools.filter((tool) => tool.status === 'maintenance').forEach((tool) => list.push({
      id: `m-${tool.id}`, tone: 'orange', icon: Wrench, attention: true, go: 'repair',
      title: 'Засвар хийгдэж байна', text: `${tool.name} · ${tool.code}`,
    }))
    if (pendingCount > 0) list.push({
      id: 'sync', tone: 'blue', icon: Cloud, attention: false, go: 'sync',
      title: 'Синхрончлол хүлээгдэж байна', text: `${pendingCount} демо үйлдэл илгээгдээгүй`,
    })
    events.slice(0, 6).forEach((event) => {
      const names = event.toolIds.map((id) => tools.find((tool) => tool.id === id)?.name ?? id).join(', ')
      list.push({
        id: `e-${event.id}`, tone: event.type === 'Олголт' ? 'orange' : 'green', icon: event.type === 'Олголт' ? ArrowDownToLine : ArrowLeftRight, attention: false, go: 'history',
        title: event.type === 'Олголт' ? 'Багаж олгогдлоо' : 'Багаж буцаагдлаа', text: `${names} · ${person(event.employeeId)}`, date: event.date,
      })
    })
    return list
  }, [tools, events, employees, pendingCount])

  const shown = tab === 'attention' ? notices.filter((notice) => notice.attention) : notices
  const attentionTotal = notices.filter((notice) => notice.attention).length

  return (
    <section className="page-stack">
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === 'all'} className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>Бүгд ({notices.length})</button>
        <button role="tab" aria-selected={tab === 'attention'} className={tab === 'attention' ? 'active' : ''} onClick={() => setTab('attention')}>Анхаарах ({attentionTotal})</button>
      </div>
      <div className="notice-list">
        {shown.map((notice) => {
          const Icon = notice.icon
          return (
            <button key={notice.id} className={`notice ${notice.tone}`} onClick={() => onGo(notice.go)}>
              <span className="notice-icon"><Icon size={20} /></span>
              <span className="notice-copy">
                <strong>{notice.title}</strong>
                <span>{notice.text}</span>
                {notice.date && <small>{dateLabel(notice.date)}</small>}
              </span>
            </button>
          )
        })}
        {!shown.length && <div className="empty-state"><Bell size={18} /> Шинэ мэдэгдэл алга.</div>}
      </div>
    </section>
  )
}
