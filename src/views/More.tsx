import { BarChart3, ChevronRight, Cloud, HardHat, LogOut, Settings, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CountUp } from '../components/Art'

export type MoreTarget = 'employees' | 'history' | 'sync' | 'settings'

export default function MoreView({ toolsCount, availablePercent, eventsCount, pendingCount, onGo, onLogout }: {
  toolsCount: number
  availablePercent: number
  eventsCount: number
  pendingCount: number
  onGo: (target: MoreTarget) => void
  onLogout: () => void
}) {
  const items: { id: MoreTarget; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: 'employees', label: 'Ажилтнууд', icon: Users },
    { id: 'history', label: 'Түүх ба тайлан', icon: BarChart3 },
    { id: 'sync', label: 'Синхрончлол', icon: Cloud, badge: pendingCount },
    { id: 'settings', label: 'Тохиргоо', icon: Settings },
  ]
  return (
    <section className="page-stack profile">
      <div className="profile-card">
        <div className="profile-avatar"><HardHat size={34} strokeWidth={1.7} /></div>
        <div>
          <strong>Агуулахын систем</strong>
          <span>Демо хэрэглэгч · Багаж хариуцагч</span>
        </div>
      </div>
      <div className="profile-stats">
        <div><strong><CountUp value={toolsCount} /></strong><span>Багаж</span></div>
        <div><strong><CountUp value={availablePercent} />%</strong><span>Бэлэн</span></div>
        <div><strong><CountUp value={eventsCount} /></strong><span>Үйлдэл</span></div>
      </div>
      <div className="menu-list">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.id} onClick={() => onGo(item.id)}>
              <Icon size={20} />
              <span>{item.label}</span>
              {!!item.badge && <i>{item.badge}</i>}
              <ChevronRight size={18} />
            </button>
          )
        })}
        <button className="danger" onClick={onLogout}>
          <LogOut size={20} />
          <span>Гарах</span>
          <ChevronRight size={18} />
        </button>
      </div>
      <p className="profile-foot">Уурхайн багажны бүртгэл · Демо хувилбар v1.0</p>
    </section>
  )
}
