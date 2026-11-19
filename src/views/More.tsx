import { Bell, ChevronRight, History, RefreshCw, Settings, Users, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type MoreTarget = 'repair' | 'notifications' | 'employees' | 'history' | 'sync' | 'settings'

export default function MoreView({ attentionCount, pendingCount, repairCount, onGo }: {
  attentionCount: number
  pendingCount: number
  repairCount: number
  onGo: (target: MoreTarget) => void
}) {
  const groups: { id: MoreTarget; label: string; note: string; icon: LucideIcon; badge?: number }[][] = [
    [
      { id: 'repair', label: 'Засвар', note: 'Засварт байгаа багаж, хүсэлт', icon: Wrench, badge: repairCount },
      { id: 'notifications', label: 'Мэдэгдэл', note: 'Хугацаа хэтэрсэн, гэмтэлтэй багаж', icon: Bell, badge: attentionCount },
    ],
    [
      { id: 'employees', label: 'Ажилтнууд', note: 'Үнэмлэхний баркод, гарт байгаа багаж', icon: Users },
      { id: 'history', label: 'Түүх', note: 'Олголт, буцаалтын бүртгэл, CSV', icon: History },
    ],
    [
      { id: 'sync', label: 'Синхрончлол', note: 'Илгээгдээгүй үйлдлүүд', icon: RefreshCw, badge: pendingCount },
      { id: 'settings', label: 'Тохиргоо', note: 'Апп болон өгөгдлийн мэдээлэл', icon: Settings },
    ],
  ]
  return (
    <div className="records more">
      {groups.map((group, index) => (
        <div className="board menu" key={index}>
          {group.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => onGo(item.id)}>
                <span className="menu-icon"><Icon size={20} /></span>
                <span className="menu-copy"><strong>{item.label}</strong><small>{item.note}</small></span>
                {!!item.badge && <b className="count-badge">{item.badge}</b>}
                <ChevronRight size={18} className="menu-go" />
              </button>
            )
          })}
        </div>
      ))}
      <p className="footnote">MineTool, демо хувилбар. Уурхайн өгөгдлийн сантай холбогдоогүй тул өөрчлөлт зөвхөн энэ төхөөрөмжид хадгалагдана.</p>
    </div>
  )
}
