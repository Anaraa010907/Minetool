import { useMemo } from 'react'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Bell, ChevronRight, Clock3, Cloud, SearchX, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { dateLabel } from '../lib/shared'
import type { Employee, EventRecord, ToolItem } from '../lib/shared'

export type NotifyTarget = 'return' | 'inventory' | 'repair' | 'sync' | 'history'
type Tone = 'bad' | 'late' | 'fix' | 'info' | 'ok' | 'out'
type Notice = { id: string; tone: Tone; icon: LucideIcon; title: string; text: string; date?: string; go: NotifyTarget }

export default function NotificationsView({ tools, events, employees, pendingCount, onGo }: {
  tools: ToolItem[]
  events: EventRecord[]
  employees: Employee[]
  pendingCount: number
  onGo: (target: NotifyTarget) => void
}) {
  const { attention, recent } = useMemo(() => {
    const person = (id?: string) => employees.find(employee => employee.id === id)?.name ?? ''
    const lastIssue = (toolId: string) => events.find(event => event.type === 'Олголт' && event.toolIds.includes(toolId))
    const attention: Notice[] = []
    tools.filter(tool => tool.status === 'overdue').forEach(tool => attention.push({
      id: `o-${tool.id}`, tone: 'late', icon: Clock3, go: 'return',
      title: `${tool.code} буцаах хугацаа хэтэрсэн`, text: `${tool.name}, эзэмшигч ${person(tool.holderId)}`, date: lastIssue(tool.id)?.date,
    }))
    tools.filter(tool => tool.status === 'damaged').forEach(tool => attention.push({
      id: `d-${tool.id}`, tone: 'bad', icon: AlertTriangle, go: 'repair',
      title: `${tool.code} гэмтэлтэй`, text: `${tool.name}. Засварт илгээх шаардлагатай.`,
    }))
    tools.filter(tool => tool.status === 'lost').forEach(tool => attention.push({
      id: `l-${tool.id}`, tone: 'bad', icon: SearchX, go: 'inventory',
      title: `${tool.code} алдагдсан`, text: tool.name,
    }))
    tools.filter(tool => tool.status === 'maintenance').forEach(tool => attention.push({
      id: `m-${tool.id}`, tone: 'fix', icon: Wrench, go: 'repair',
      title: `${tool.code} засварт байна`, text: tool.name,
    }))
    const recent: Notice[] = []
    if (pendingCount > 0) recent.push({
      id: 'sync', tone: 'info', icon: Cloud, go: 'sync',
      title: `${pendingCount} үйлдэл илгээгдээгүй`, text: 'Уурхайн сервертэй холбогдоход илгээгдэнэ.',
    })
    events.slice(0, 8).forEach(event => {
      const names = event.toolIds.map(id => tools.find(tool => tool.id === id)?.name ?? id).join(', ')
      const out = event.type === 'Олголт'
      recent.push({
        id: `e-${event.id}`, tone: out ? 'out' : 'ok', icon: out ? ArrowUpFromLine : ArrowDownToLine, go: 'history',
        title: names, text: out ? `${person(event.employeeId)} авсан` : `${person(event.employeeId)} буцаасан`, date: event.date,
      })
    })
    return { attention, recent }
  }, [tools, events, employees, pendingCount])

  const renderList = (items: Notice[]) => (
    <div className="board notice-list">
      {items.map(notice => {
        const Icon = notice.icon
        return (
          <button key={notice.id} className={`notice t-${notice.tone}`} onClick={() => onGo(notice.go)}>
            <span className="notice-icon"><Icon size={19} /></span>
            <span className="notice-copy">
              <strong>{notice.title}</strong>
              <span>{notice.text}</span>
              {notice.date && <small>{dateLabel(notice.date)}</small>}
            </span>
            <ChevronRight size={18} className="notice-go" />
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="records">
      <section className="section">
        <div className="section-head"><h2>Анхаарах</h2><span className="section-note">{attention.length}</span></div>
        {attention.length ? renderList(attention) : <div className="empty"><Bell size={20} /><span>Анхаарах зүйл алга.</span></div>}
      </section>
      <section className="section">
        <div className="section-head"><h2>Сүүлийн үйлдэл</h2></div>
        {recent.length ? renderList(recent) : <div className="empty"><Bell size={20} /><span>Шинэ мэдэгдэл алга.</span></div>}
      </section>
    </div>
  )
}
