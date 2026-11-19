import type { ReactNode } from 'react'
import { Droplets, Flame, Hammer, Package, Ruler, Wrench, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { statusLabels } from '../lib/shared'
import type { ToolItem, ToolStatus } from '../lib/shared'

const categoryIcons: Record<string, LucideIcon> = {
  'Гар багаж': Hammer,
  'Цахилгаан багаж': Zap,
  'Өрөмдлөг': Wrench,
  'Гагнуур': Flame,
  'Хэмжих хэрэгсэл': Ruler,
  'Насос': Droplets,
}

export function CategoryIcon({ category, size = 16 }: { category: string; size?: number }) {
  const Icon = categoryIcons[category] ?? Package
  return <Icon size={size} aria-hidden="true" />
}

export function StatusChip({ status }: { status: ToolStatus }) {
  return <span className={`chip s-${status}`}><i aria-hidden="true" />{statusLabels[status]}</span>
}

type TagProps = {
  tool: ToolItem
  /** Нэрийн доорх мөр. Өгөөгүй бол ангиллыг харуулна. */
  meta?: ReactNode
  /** Баруун талын нэмэлт хэсэг (товч, зураг, сонголтын тэмдэг). */
  aside?: ReactNode
  selected?: boolean
  showStatus?: boolean
  className?: string
  /** Нэрэн дээр дарахад дэлгэрэнгүйг нээнэ. */
  onOpen?: () => void
}

function TagInner({ tool, meta, aside, showStatus = true, onOpen }: TagProps) {
  return (
    <>
      <span className="tag-stub" aria-hidden="true"><i /></span>
      <span className="tag-body">
        <span className="tag-top">
          <span className="tag-code">{tool.code}</span>
          {showStatus && <StatusChip status={tool.status} />}
        </span>
        {onOpen
          ? <button type="button" className="tag-name tag-open" onClick={onOpen}>{tool.name}</button>
          : <strong className="tag-name">{tool.name}</strong>}
        <span className="tag-meta">{meta ?? <><CategoryIcon category={tool.category} size={14} />{tool.category}</>}</span>
      </span>
      {aside && <span className="tag-aside">{aside}</span>}
    </>
  )
}

/**
 * Багажийг уурхайн багажны агуулахад хэрэглэдэг өлгөөтэй шошго хэлбэрээр харуулна.
 * control өгвөл label (сонгох жагсаалт), onClick өгвөл товч, бусад үед энгийн блок болно.
 */
export function ToolTag(props: TagProps & { onClick?: () => void; control?: ReactNode; label?: string }) {
  const { tool, selected, className, control, onClick, label } = props
  const cls = ['tag', `s-${tool.status}`, selected ? 'is-selected' : '', control || onClick ? 'is-interactive' : '', className ?? ''].filter(Boolean).join(' ')
  if (control) return <label className={cls}>{control}<TagInner {...props} /></label>
  if (onClick) return <button type="button" className={cls} onClick={onClick} aria-label={label}><TagInner {...props} /></button>
  return <div className={cls}><TagInner {...props} /></div>
}
