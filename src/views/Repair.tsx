import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ClipboardList, Wrench } from 'lucide-react'
import { CategoryIcon } from '../components/Art'
import { dateLabel, repairKinds, statusLabels } from '../lib/shared'
import type { RepairRecord, ToolItem } from '../lib/shared'

type Tab = 'active' | 'request' | 'history'

export default function RepairView({ tools, repairs, onRequest, onFinish }: {
  tools: ToolItem[]
  repairs: RepairRecord[]
  onRequest: (toolId: string, kind: string, note: string) => string | null
  onFinish: (toolId: string) => void
}) {
  const [tab, setTab] = useState<Tab>('active')
  const [toolId, setToolId] = useState('')
  const [kind, setKind] = useState(repairKinds[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const inRepair = tools.filter((tool) => tool.status === 'maintenance' || tool.status === 'damaged')
  const requestable = tools.filter((tool) => tool.status === 'available' || tool.status === 'damaged')
  const openRecord = (id: string) => repairs.filter((item) => item.toolId === id && item.status === 'open').sort((a, b) => b.date.localeCompare(a.date))[0]
  const history = [...repairs].sort((a, b) => b.date.localeCompare(a.date))
  const toolOf = (id: string) => tools.find((tool) => tool.id === id)

  const submit = () => {
    if (!toolId) return setError('Засварт илгээх багажаа сонгоно уу.')
    const message = onRequest(toolId, kind, note.trim())
    if (message) return setError(message)
    setError(''); setToolId(''); setNote(''); setTab('active')
  }

  return (
    <section className="page-stack">
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === 'active'} className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>Засварт ({inRepair.length})</button>
        <button role="tab" aria-selected={tab === 'request'} className={tab === 'request' ? 'active' : ''} onClick={() => setTab('request')}>Хүсэлт гаргах</button>
        <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Түүх</button>
      </div>

      {tab === 'active' && (
        <div className="card-list">
          {inRepair.map((tool) => {
            const record = openRecord(tool.id)
            return (
              <article className="repair-card" key={tool.id}>
                <div className="tool-tile"><CategoryIcon category={tool.category} size={24} /></div>
                <div className="repair-copy">
                  <strong>{tool.name}</strong>
                  <small>{tool.code} · {tool.category}</small>
                  <span className="repair-kind"><Wrench size={14} /> {record?.kind ?? 'Засвар үйлчилгээ'}</span>
                  {record?.note && <p>{record.note}</p>}
                  {record && <small>{dateLabel(record.date)}</small>}
                </div>
                <div className="repair-side">
                  <span className={`badge ${tool.status}`}><i />{statusLabels[tool.status]}</span>
                  <button className="button primary small" onClick={() => onFinish(tool.id)}><CheckCircle2 size={16} /> Засвар дууссан</button>
                </div>
              </article>
            )
          })}
          {!inRepair.length && <div className="empty-state"><CheckCircle2 size={18} /> Засварт байгаа багаж алга байна.</div>}
        </div>
      )}

      {tab === 'request' && (
        <div className="panel form-panel">
          <label className="form-field">
            <span>Багаж сонгох</span>
            <div className="select-wrap">
              <select value={toolId} onChange={(event) => { setToolId(event.target.value); setError('') }}>
                <option value="">— Багаж сонгоно уу —</option>
                {requestable.map((tool) => <option key={tool.id} value={tool.id}>{tool.name} · {tool.code}</option>)}
              </select>
              <ChevronDown size={16} />
            </div>
          </label>
          <label className="form-field">
            <span>Асуудлын төрөл</span>
            <div className="select-wrap">
              <select value={kind} onChange={(event) => setKind(event.target.value)}>
                {repairKinds.map((item) => <option key={item}>{item}</option>)}
              </select>
              <ChevronDown size={16} />
            </div>
          </label>
          <label className="form-field">
            <span>Тайлбар</span>
            <textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Асуудлын дэлгэрэнгүй тайлбар…" />
          </label>
          {error && <p className="form-error"><AlertTriangle size={15} /> {error}</p>}
          <button className="button primary big full-width" onClick={submit}><Wrench size={18} /> Засварт илгээх</button>
          <p className="field-hint">Олгогдсон багажийг эхлээд «Багаж буцаах» хэсгээр хүлээн авч, нөхцөлийг нь «Засвар шаардлагатай» гэж бүртгэнэ.</p>
        </div>
      )}

      {tab === 'history' && (
        <div className="card-list">
          {history.map((item) => {
            const tool = toolOf(item.toolId)
            return (
              <article className="repair-card compact" key={item.id}>
                <div className="tool-tile"><ClipboardList size={22} /></div>
                <div className="repair-copy">
                  <strong>{tool?.name ?? 'Устгагдсан багаж'}</strong>
                  <small>{tool?.code} · {item.kind}</small>
                  {item.note && <p>{item.note}</p>}
                  <small>{dateLabel(item.date)}{item.doneDate ? ` → ${dateLabel(item.doneDate)}` : ''}</small>
                </div>
                <span className={`badge ${item.status === 'done' ? 'available' : 'maintenance'}`}><i />{item.status === 'done' ? 'Дууссан' : 'Хийгдэж байна'}</span>
              </article>
            )
          })}
          {!history.length && <div className="empty-state"><ClipboardList size={18} /> Засварын түүх хоосон байна.</div>}
        </div>
      )}
    </section>
  )
}
