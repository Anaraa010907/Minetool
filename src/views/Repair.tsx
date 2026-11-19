import { useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, ClipboardList, Search, Wrench } from 'lucide-react'
import { ToolTag } from '../components/ToolTag'
import { dateLabel, repairKinds } from '../lib/shared'
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
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState(repairKinds[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const inRepair = tools.filter(tool => tool.status === 'maintenance' || tool.status === 'damaged')
  const requestable = tools.filter(tool => (tool.status === 'available' || tool.status === 'damaged')
    && `${tool.name} ${tool.code} ${tool.category}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => Number(b.status === 'damaged') - Number(a.status === 'damaged'))
  const openRecord = (id: string) => repairs.filter(item => item.toolId === id && item.status === 'open').sort((a, b) => b.date.localeCompare(a.date))[0]
  const history = [...repairs].sort((a, b) => b.date.localeCompare(a.date))
  const toolOf = (id: string) => tools.find(tool => tool.id === id)

  const submit = () => {
    if (!toolId) return setError('Засварт илгээх багажаа сонгоно уу.')
    const message = onRequest(toolId, kind, note.trim())
    if (message) return setError(message)
    setError(''); setToolId(''); setNote(''); setQuery(''); setTab('active')
  }

  return (
    <div className="records">
      <div className="seg" role="tablist" aria-label="Засвар">
        <button role="tab" aria-selected={tab === 'active'} className={tab === 'active' ? 'is-on' : ''} onClick={() => setTab('active')}>Засварт <b>{inRepair.length}</b></button>
        <button role="tab" aria-selected={tab === 'request'} className={tab === 'request' ? 'is-on' : ''} onClick={() => setTab('request')}>Шинэ хүсэлт</button>
        <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'is-on' : ''} onClick={() => setTab('history')}>Түүх</button>
      </div>

      {tab === 'active' && (inRepair.length ? (
        <div className="repair-list">
          {inRepair.map(tool => {
            const record = openRecord(tool.id)
            return (
              <article className="repair-item" key={tool.id}>
                <ToolTag tool={tool} meta={<><Wrench size={14} />{record?.kind ?? 'Засвар'}</>} />
                <div className="repair-note">
                  <p>{record?.note || 'Тайлбар оруулаагүй'}</p>
                  {record && <small>Нээсэн {dateLabel(record.date)}</small>}
                  <button className="btn btn-sm" onClick={() => onFinish(tool.id)}><CheckCircle2 size={16} /> Засвар дууссан</button>
                </div>
              </article>
            )
          })}
        </div>
      ) : <div className="empty"><CheckCircle2 size={20} /><span>Засварт байгаа багаж алга.</span></div>)}

      {tab === 'request' && (
        <div className="request">
          <section className="step">
            <header className="step-head"><span className="step-no" aria-hidden="true">1</span><h2>Багаж сонгох</h2></header>
            <label className="field-icon">
              <Search size={18} />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Нэр эсвэл кодоор хайх" aria-label="Багаж хайх" />
            </label>
            <div className="tag-list short">
              {requestable.map(tool => (
                <ToolTag key={tool.id} tool={tool} selected={toolId === tool.id}
                  control={<input type="radio" name="repair-tool" className="sr-only" checked={toolId === tool.id} onChange={() => { setToolId(tool.id); setError('') }} aria-label={`${tool.name} сонгох`} />}
                  aside={<span className="tick" aria-hidden="true"><Check size={18} strokeWidth={3} /></span>} />
              ))}
              {!requestable.length && <div className="empty"><Search size={20} /><span>Засварт илгээж болох багаж олдсонгүй.</span></div>}
            </div>
            <p className="hint">Ажилтны гарт байгаа багажийг эхлээд «Буцаах» хэсгээр хүлээн авч, нөхцөлийг нь «Засвар шаардлагатай» гэж бүртгэнэ.</p>
          </section>
          <section className="step">
            <header className="step-head"><span className="step-no" aria-hidden="true">2</span><h2>Асуудал</h2></header>
            <div className="chips wrap" role="radiogroup" aria-label="Асуудлын төрөл">
              {repairKinds.map(item => (
                <button key={item} type="button" role="radio" aria-checked={kind === item} className={`fchip ${kind === item ? 'is-on' : ''}`} onClick={() => setKind(item)}>{item}</button>
              ))}
            </div>
            <label className="field">
              <span>Тайлбар</span>
              <textarea rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Юу эвдэрсэн, юу хийх шаардлагатай вэ" />
            </label>
            {error && <p className="form-error"><AlertTriangle size={15} />{error}</p>}
            <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={!toolId}><Wrench size={18} /> Засварт илгээх</button>
          </section>
        </div>
      )}

      {tab === 'history' && (history.length ? (
        <ol className="board plain-list repair-history">
          {history.map(item => {
            const tool = toolOf(item.toolId)
            return (
              <li key={item.id}>
                <span className={`state ${item.status === 'done' ? 'is-on' : 'is-wait'}`}>{item.status === 'done' ? 'Дууссан' : 'Хийгдэж байна'}</span>
                <span className="rh-main">
                  <strong><b className="code">{tool?.code ?? '—'}</b>{tool?.name ?? 'Устгагдсан багаж'}</strong>
                  <small>{item.kind}{item.note ? `. ${item.note}` : ''}</small>
                </span>
                <time>{item.doneDate ? `Дууссан ${dateLabel(item.doneDate)}` : `Нээсэн ${dateLabel(item.date)}`}</time>
              </li>
            )
          })}
        </ol>
      ) : <div className="empty"><ClipboardList size={20} /><span>Засварын түүх хоосон.</span></div>)}
    </div>
  )
}
