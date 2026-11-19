import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import {
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Bell, Camera, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Cloud, CloudOff, Download, Ellipsis,
  History, Image as ImageIcon, Keyboard, PackagePlus, Pencil, Plus, RefreshCw, ScanBarcode,
  Search, Settings, Tags, Trash2, UserRound, Users, Warehouse, Wrench, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import CameraScanner from './components/CameraScanner'
import { CategoryIcon, ToolTag } from './components/ToolTag'
import RepairView from './views/Repair'
import NotificationsView from './views/Notifications'
import MoreView from './views/More'
import {
  conditionLabels, dateLabel, dayHeading, dayKey, initials, isRepair, shortDate,
  statusLabels, statusOrder, timeLabel, todayHeading,
} from './lib/shared'
import type { Condition, Employee, EventRecord, RepairRecord, ToolItem, ToolStatus } from './lib/shared'
import { deleteToolPhoto, getToolPhoto, saveToolPhoto } from './lib/toolPhotos'

type Page = 'dashboard' | 'issue' | 'return' | 'repair' | 'inventory' | 'employees' | 'history' | 'sync' | 'settings' | 'notifications' | 'more'
type DemoData = { version: 1; tools: ToolItem[]; employees: Employee[]; events: EventRecord[]; repairs: RepairRecord[]; categories: string[]; pendingCount: number; lastSync: string }
type ScanTarget = 'employee'
type ToolPhotoChange = { file?: File; remove: boolean }

const maxToolPhotoBytes = 5 * 1024 * 1024

const initialEmployees: Employee[] = [
  { id: 'EMP-1042', name: 'Бат-Эрдэнэ Даваа', department: 'Уулын ашиглалт', position: 'Экскаваторын оператор', barcode: '88001042', active: true },
  { id: 'EMP-1078', name: 'Номин-Эрдэнэ Ганболд', department: 'Засвар үйлчилгээ', position: 'Механик инженер', barcode: '88001078', active: true },
  { id: 'EMP-1091', name: 'Тэмүүлэн Энхтөр', department: 'Өрөмдлөг', position: 'Өрмийн оператор', barcode: '88001091', active: true },
  { id: 'EMP-1120', name: 'Саруул Мөнхбат', department: 'Агуулах', position: 'Агуулахын ажилтан', barcode: '88001120', active: true },
  { id: 'EMP-1146', name: 'Эрдэнэбаяр Цогт', department: 'Уулын ашиглалт', position: 'Маркшейдер', barcode: '88001146', active: false },
  { id: 'EMP-1183', name: 'Хулан Амарсанаа', department: 'Цахилгаан', position: 'Цахилгаанчин', barcode: '88001183', active: true },
]

const initialTools: ToolItem[] = [
  { id: 't1', code: 'DRL-0241', name: 'Цохилтот дрилл', category: 'Өрөмдлөг', status: 'available' },
  { id: 't2', code: 'GRD-0108', name: 'Өнцөг зүлгүүр 125мм', category: 'Цахилгаан багаж', status: 'issued', holderId: 'EMP-1078' },
  { id: 't3', code: 'WLD-0034', name: 'Гагнуурын аппарат', category: 'Гагнуур', status: 'available' },
  { id: 't4', code: 'MTR-0162', name: 'Мультиметр', category: 'Хэмжих хэрэгсэл', status: 'issued', holderId: 'EMP-1183' },
  { id: 't5', code: 'WRN-0320', name: 'Торцовны ком', category: 'Гар багаж', status: 'available' },
  { id: 't6', code: 'SAW-0017', name: 'Дугуй хөрөө', category: 'Цахилгаан багаж', status: 'overdue', holderId: 'EMP-1042' },
  { id: 't7', code: 'HAM-0275', name: 'Лантуу 5кг', category: 'Гар багаж', status: 'available' },
  { id: 't8', code: 'LEV-0043', name: 'Лазер тэгш ус', category: 'Хэмжих хэрэгсэл', status: 'maintenance' },
  { id: 't9', code: 'GRD-0112', name: 'Өнцөг зүлгүүр 230мм', category: 'Цахилгаан багаж', status: 'damaged' },
  { id: 't10', code: 'PMP-0008', name: 'Усны насос', category: 'Насос', status: 'lost' },
  { id: 't11', code: 'DRL-0250', name: 'Аккумулятор дрилл', category: 'Өрөмдлөг', status: 'available' },
  { id: 't12', code: 'WLD-0041', name: 'Электрод баригч', category: 'Гагнуур', status: 'available' },
]

const initialEvents: EventRecord[] = [
  { id: 1, type: 'Олголт', date: '2026-10-13T08:42:00', employeeId: 'EMP-1078', toolIds: ['t2'] },
  { id: 2, type: 'Буцаалт', date: '2026-10-13T08:16:00', employeeId: 'EMP-1091', toolIds: ['t3'], condition: 'Хэвийн' },
  { id: 3, type: 'Олголт', date: '2026-10-13T07:55:00', employeeId: 'EMP-1042', toolIds: ['t6'] },
  { id: 4, type: 'Буцаалт', date: '2026-10-12T17:30:00', employeeId: 'EMP-1183', toolIds: ['t4'], condition: 'Хэвийн' },
  { id: 5, type: 'Олголт', date: '2026-10-12T16:10:00', employeeId: 'EMP-1091', toolIds: ['t5'] },
  { id: 6, type: 'Олголт', date: '2026-10-12T09:05:00', employeeId: 'EMP-1183', toolIds: ['t4'] },
]

const initialRepairs: RepairRecord[] = [
  { id: 9001, toolId: 't8', kind: 'Элэгдэл / үйлчилгээ', note: 'Лазерын тохиргоо, шалгалт тохируулга хийх', date: '2026-10-11T10:20:00', status: 'open' },
  { id: 9002, toolId: 't9', kind: 'Механик гэмтэл', note: 'Дискний бэхэлгээний цоож эвдэрсэн', date: '2026-10-12T14:05:00', status: 'open' },
  { id: 9000, toolId: 't5', kind: 'Элэгдэл / үйлчилгээ', note: 'Бариулын бэхэлгээг сольсон', date: '2026-10-05T09:10:00', status: 'done', doneDate: '2026-10-06T16:30:00' },
]

function normalizeRepairs(saved: unknown, tools: readonly ToolItem[]): RepairRecord[] {
  if (Array.isArray(saved)) return saved.filter(isRepair)
  return initialRepairs.filter(item => tools.some(tool => tool.id === item.toolId)).map(item => ({ ...item }))
}

const demoStorageKey = 'minetool-manager.demo.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEmployee(value: unknown): value is Employee {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.department === 'string'
    && typeof value.position === 'string'
    && typeof value.barcode === 'string'
    && typeof value.active === 'boolean'
}

function isTool(value: unknown): value is ToolItem {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && typeof value.category === 'string'
    && ['available', 'issued', 'overdue', 'damaged', 'lost', 'maintenance', 'retired'].includes(String(value.status))
    && (value.holderId === undefined || typeof value.holderId === 'string')
    && (value.photoKey === undefined || typeof value.photoKey === 'string')
}

function isEvent(value: unknown): value is EventRecord {
  return isRecord(value)
    && typeof value.id === 'number'
    && (value.type === 'Олголт' || value.type === 'Буцаалт')
    && typeof value.date === 'string'
    && !Number.isNaN(Date.parse(value.date))
    && typeof value.employeeId === 'string'
    && Array.isArray(value.toolIds)
    && value.toolIds.every(toolId => typeof toolId === 'string')
    && (value.condition === undefined || typeof value.condition === 'string')
}

const defaultCategories = ['Гар багаж', 'Цахилгаан багаж', 'Өрөмдлөг', 'Гагнуур', 'Хэмжих хэрэгсэл', 'Насос']

const cleanCategoryName = (value: string) => value.trim().replace(/\s+/g, ' ')

function normalizeCategories(saved: unknown, tools: readonly ToolItem[]): string[] {
  const result: string[] = []
  const add = (value: unknown) => {
    if (typeof value !== 'string') return
    const name = cleanCategoryName(value)
    if (name && !result.some(item => item.toLocaleLowerCase() === name.toLocaleLowerCase())) result.push(name)
  }
  if (Array.isArray(saved)) saved.forEach(add)
  else defaultCategories.forEach(add)
  tools.forEach(tool => add(tool.category))
  return result
}

// Өмнө хадгалагдсан QR дугаарыг багажийн бүртгэлээс хасна.
function stripLegacyQr(tool: ToolItem): ToolItem {
  const { qrId: _qrId, ...rest } = tool as ToolItem & { qrId?: string }
  return rest
}

function toolMatches(tool: ToolItem, query: string, category: string, holderName = ''): boolean {
  const text = query.trim().toLocaleLowerCase()
  return (category === 'all' || tool.category === category)
    && (!text || `${tool.name} ${tool.category} ${tool.code} ${holderName}`.toLocaleLowerCase().includes(text))
}

function freshDemoData(): DemoData {
  return {
    version: 1,
    tools: initialTools.map(tool => ({ ...tool })),
    employees: initialEmployees.map(employee => ({ ...employee })),
    events: initialEvents.map(event => ({ ...event, toolIds: [...event.toolIds] })),
    repairs: initialRepairs.map(item => ({ ...item })),
    categories: normalizeCategories(undefined, initialTools),
    pendingCount: 3,
    lastSync: '2026-10-13 08:42',
  }
}

function readDemoData(): DemoData {
  try {
    const saved = window.localStorage.getItem(demoStorageKey)
    if (!saved) return freshDemoData()
    const parsed: unknown = JSON.parse(saved)
    if (!isRecord(parsed)
      || parsed.version !== 1
      || !Array.isArray(parsed.tools) || !parsed.tools.every(isTool)
      || !Array.isArray(parsed.employees) || !parsed.employees.every(isEmployee)
      || !Array.isArray(parsed.events) || !parsed.events.every(isEvent)
      || typeof parsed.pendingCount !== 'number' || !Number.isInteger(parsed.pendingCount) || parsed.pendingCount < 0
      || typeof parsed.lastSync !== 'string') return freshDemoData()
    const data = parsed as DemoData
    const cleanedTools = data.tools.map(stripLegacyQr)
    return { ...data, tools: cleanedTools, categories: normalizeCategories(parsed.categories, cleanedTools), repairs: normalizeRepairs(parsed.repairs, cleanedTools) }
  } catch {
    return freshDemoData()
  }
}

const pageMeta: Record<Page, { title: string; nav: string; icon: LucideIcon }> = {
  dashboard: { title: 'Өнөөдөр', nav: 'Нүүр', icon: Warehouse },
  issue: { title: 'Багаж олгох', nav: 'Олгох', icon: ArrowUpFromLine },
  return: { title: 'Багаж буцаах', nav: 'Буцаах', icon: ArrowDownToLine },
  repair: { title: 'Засвар', nav: 'Засвар', icon: Wrench },
  inventory: { title: 'Багажийн бүртгэл', nav: 'Багаж', icon: Tags },
  employees: { title: 'Ажилтнууд', nav: 'Ажилтнууд', icon: Users },
  history: { title: 'Түүх', nav: 'Түүх', icon: History },
  notifications: { title: 'Мэдэгдэл', nav: 'Мэдэгдэл', icon: Bell },
  sync: { title: 'Синхрончлол', nav: 'Синхрончлол', icon: RefreshCw },
  settings: { title: 'Тохиргоо', nav: 'Тохиргоо', icon: Settings },
  more: { title: 'Бусад', nav: 'Бусад', icon: Ellipsis },
}

const railGroups: Page[][] = [
  ['dashboard', 'issue', 'return', 'repair'],
  ['inventory', 'employees', 'history'],
  ['notifications', 'sync', 'settings'],
]

const tabs: { id: Page; match: Page[] }[] = [
  { id: 'dashboard', match: ['dashboard'] },
  { id: 'issue', match: ['issue'] },
  { id: 'return', match: ['return'] },
  { id: 'inventory', match: ['inventory'] },
  { id: 'more', match: ['more', 'repair', 'notifications', 'employees', 'history', 'sync', 'settings'] },
]

// Утсан дээр "Бусад" цэснээс нээгддэг хуудсууд буцах холбоостой.
const morePages: Page[] = ['repair', 'notifications', 'employees', 'history', 'sync', 'settings']

function useInView<T extends Element>(ref: RefObject<T | null>, active: boolean) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!active || !element || typeof IntersectionObserver === 'undefined') { setInView(false); return }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, active])
  return inView
}

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [demoData, setDemoData] = useState<DemoData>(() => readDemoData())
  const { tools, employees, events, repairs, categories, pendingCount, lastSync } = demoData
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [toolPhotoUrls, setToolPhotoUrls] = useState<Record<string, string>>({})
  const [photoViewerToolId, setPhotoViewerToolId] = useState<string | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [toast, setToast] = useState<{ text: string; error?: boolean; id: number } | null>(null)
  const [scannerTarget, setScannerTarget] = useState<ScanTarget | null>(null)
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryStatus, setInventoryStatus] = useState('all')
  const [inventoryCategory, setInventoryCategory] = useState('all')
  const [inventoryPage, setInventoryPage] = useState(1)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [historySearch, setHistorySearch] = useState('')
  const [historyType, setHistoryType] = useState('all')
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')
  const [issueBarcode, setIssueBarcode] = useState('')
  const [issueEmployee, setIssueEmployee] = useState<Employee | null>(null)
  const [issueEmployeePreview, setIssueEmployeePreview] = useState<Employee | null>(null)
  const [issueCategory, setIssueCategory] = useState('all')
  const [issueToolQuery, setIssueToolQuery] = useState('')
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])
  const [issueStaffConfirmed, setIssueStaffConfirmed] = useState(false)
  const [returnQuery, setReturnQuery] = useState('')
  const [returnToolId, setReturnToolId] = useState('')
  const [returnCategory, setReturnCategory] = useState('all')
  const [returnCondition, setReturnCondition] = useState<Condition>('good')
  const [returnEmployeeConfirmed, setReturnEmployeeConfirmed] = useState(false)
  const [returnStaffConfirmed, setReturnStaffConfirmed] = useState(false)
  const [dialog, setDialog] = useState<ToolItem | 'new' | null>(null)
  const [toolDetailsId, setToolDetailsId] = useState<string | null>(null)
  const issueTicketRef = useRef<HTMLElement>(null)
  const returnTicketRef = useRef<HTMLElement>(null)
  const issueTicketVisible = useInView(issueTicketRef, page === 'issue')
  const returnTicketVisible = useInView(returnTicketRef, page === 'return')

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(demoStorageKey, JSON.stringify(demoData))
      setStorageAvailable(true)
    } catch {
      setStorageAvailable(false)
    }
  }, [demoData])

  useEffect(() => {
    let cancelled = false
    const objectUrls: string[] = []
    const loadThumbnails = async () => {
      const entries = await Promise.all(demoData.tools.filter(tool => tool.photoKey).map(async tool => {
        try {
          const image = await getToolPhoto(tool.id, 'thumbnail')
          if (!image) return null
          const url = URL.createObjectURL(image)
          objectUrls.push(url)
          return [tool.id, url] as const
        } catch {
          return null
        }
      }))
      if (cancelled) {
        objectUrls.forEach(url => URL.revokeObjectURL(url))
        return
      }
      setToolPhotoUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)))
    }
    void loadThumbnails()
    return () => {
      cancelled = true
      objectUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [demoData.tools])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const employeeById = (id?: string) => employees.find(employee => employee.id === id)

  const filteredTools = useMemo(() => tools.filter(tool => (
    toolMatches(tool, inventorySearch, inventoryCategory, employees.find(employee => employee.id === tool.holderId)?.name ?? '')
    && (inventoryStatus === 'all' || tool.status === inventoryStatus)
  )), [tools, inventorySearch, inventoryCategory, inventoryStatus, employees])
  const pageSize = 12
  const pageCount = Math.max(1, Math.ceil(filteredTools.length / pageSize))
  const pageTools = filteredTools.slice((inventoryPage - 1) * pageSize, inventoryPage * pageSize)

  const filteredEmployees = employees.filter(employee => {
    const query = employeeSearch.trim().toLocaleLowerCase()
    const matchesText = !query || `${employee.id} ${employee.barcode} ${employee.name} ${employee.department} ${employee.position}`.toLocaleLowerCase().includes(query)
    return matchesText && (employeeFilter === 'all' || String(employee.active) === employeeFilter)
  })

  const filteredEvents = events.filter(event => {
    const employee = employeeById(event.employeeId)
    const toolText = event.toolIds.map(id => { const tool = tools.find(item => item.id === id); return tool ? `${tool.code} ${tool.name}` : '' }).join(' ')
    const query = historySearch.trim().toLocaleLowerCase()
    const day = dayKey(event.date)
    return (!query || `${employee?.name ?? ''} ${employee?.id ?? ''} ${toolText}`.toLocaleLowerCase().includes(query))
      && (historyType === 'all' || event.type === historyType)
      && (!historyFrom || day >= historyFrom)
      && (!historyTo || day <= historyTo)
  })
  const historyGroups = filteredEvents.reduce<{ key: string; date: string; items: EventRecord[] }[]>((groups, event) => {
    const key = dayKey(event.date)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(event)
    else groups.push({ key, date: event.date, items: [event] })
    return groups
  }, [])

  const showToast = (text: string, error = false) => setToast({ text, error, id: Date.now() })
  const changePage = (next: Page) => { setScannerTarget(null); setPage(next); window.scrollTo({ top: 0 }) }
  const addCategory = (input: string): { name?: string; error?: string } => {
    const name = cleanCategoryName(input)
    if (!name) return { error: 'Ангиллын нэрийг бичнэ үү.' }
    const existing = categories.find(item => item.toLocaleLowerCase() === name.toLocaleLowerCase())
    if (existing) return { name: existing }
    setDemoData(current => current.categories.some(item => item.toLocaleLowerCase() === name.toLocaleLowerCase())
      ? current
      : { ...current, categories: [...current.categories, name] })
    return { name }
  }
  const removeCategory = (name: string): { error?: string } => {
    const used = tools.filter(tool => tool.category === name).length
    if (used > 0) return { error: `"${name}" ангилалд ${used} багаж бүртгэлтэй тул хасах боломжгүй. Эхлээд тэдгээр багажийн ангиллыг өөрчилнө үү.` }
    if (categories.length <= 1) return { error: 'Хамгийн багадаа нэг ангилал үлдэх ёстой.' }
    setDemoData(current => ({ ...current, categories: current.categories.filter(item => item !== name) }))
    return {}
  }
  const registerEvent = (type: EventRecord['type'], employeeId: string, toolIds: string[], condition?: string, updateTools?: (current: ToolItem[]) => ToolItem[], repair?: RepairRecord) => {
    const event: EventRecord = { id: Date.now(), type, date: new Date().toISOString(), employeeId, toolIds: [...toolIds], condition }
    setDemoData(current => ({
      ...current,
      tools: updateTools ? updateTools(current.tools) : current.tools,
      events: [event, ...current.events],
      repairs: repair ? [repair, ...current.repairs] : current.repairs,
      pendingCount: current.pendingCount + 1,
    }))
  }

  const acceptEmployeeCode = (code: string) => {
    const normalizedCode = code.trim().toLowerCase()
    if (!normalizedCode) { showToast('Ажилтны баркод эсвэл дугаарыг оруулна уу.', true); return }
    const match = employees.find(employee => employee.barcode.toLowerCase() === normalizedCode || employee.id.toLowerCase() === normalizedCode)
    setIssueBarcode(code)
    setIssueEmployeePreview(match ?? null)
    if (!match) { setIssueEmployee(null); showToast(`"${code.trim()}" кодтой ажилтан бүртгэлд алга. Кодоо шалгаад дахин оруулна уу.`, true); return }
    if (!match.active) { setIssueEmployee(null); showToast(`${match.name} идэвхгүй ажилтан тул багаж олгох боломжгүй.`, true); return }
    setIssueEmployee(match)
  }
  const findIssueEmployee = () => acceptEmployeeCode(issueBarcode)
  const changeIssueEmployee = () => { setIssueEmployee(null); setIssueEmployeePreview(null); setIssueBarcode(''); setIssueStaffConfirmed(false) }

  const toggleIssueTool = (id: string) => setSelectedToolIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const confirmIssue = () => {
    const selected = tools.filter(tool => selectedToolIds.includes(tool.id))
    if (!issueEmployee) return showToast('Эхлээд ажилтны үнэмлэхийг уншуулна уу.', true)
    if (!selected.length) return showToast('Олгох багажаа сонгоно уу.', true)
    if (!issueStaffConfirmed) return showToast('Багажийг эвдрэлгүй олгосныг тэмдэглэнэ үү.', true)
    if (selected.some(tool => tool.status !== 'available')) return showToast('Сонгосон багажийн нэг нь бэлэн биш болсон байна. Жагсаалтаас дахин сонгоно уу.', true)
    registerEvent('Олголт', issueEmployee.id, selectedToolIds, undefined, current => current.map(tool => selectedToolIds.includes(tool.id) ? { ...tool, status: 'issued', holderId: issueEmployee.id } : tool))
    showToast(`${issueEmployee.name} ${selected.length} багаж авлаа. Олголт бүртгэгдлээ.`)
    resetIssue()
  }

  const selectReturnTool = (tool: ToolItem) => {
    if (!['issued', 'overdue'].includes(tool.status) || !tool.holderId) {
      showToast(`${tool.name} одоо "${statusLabels[tool.status]}" төлөвтэй тул буцаах боломжгүй.`, true)
      return
    }
    if (returnToolId === tool.id) return
    setReturnToolId(tool.id); setReturnEmployeeConfirmed(false); setReturnStaffConfirmed(false)
  }

  const confirmReturn = () => {
    const tool = tools.find(item => item.id === returnToolId)
    if (!tool || !tool.holderId || !['issued', 'overdue'].includes(tool.status)) return showToast('Буцаах багажаа сонгоно уу.', true)
    if (!returnEmployeeConfirmed || !returnStaffConfirmed) return showToast('Хоёр баталгаажуулалтыг хоёуланг нь тэмдэглэнэ үү.', true)
    const nextStatus: ToolStatus = returnCondition === 'good' ? 'available' : returnCondition === 'damaged' ? 'damaged' : 'maintenance'
    const repair: RepairRecord | undefined = nextStatus === 'available' ? undefined : {
      id: Date.now() + 1, toolId: tool.id, kind: nextStatus === 'damaged' ? 'Механик гэмтэл' : 'Элэгдэл / үйлчилгээ',
      note: 'Буцаалтын үед бүртгэсэн', date: new Date().toISOString(), status: 'open',
    }
    registerEvent('Буцаалт', tool.holderId, [tool.id], conditionLabels[returnCondition], current => current.map(item => item.id === tool.id ? { ...item, status: nextStatus, holderId: undefined } : item), repair)
    showToast(nextStatus === 'available' ? `${tool.code} буцаалт бүртгэгдлээ. Багаж бэлэн боллоо.` : `${tool.code} буцаалт бүртгэгдэж, засварын бүртгэл нээгдлээ.`)
    resetReturn()
  }

  const resetIssue = () => {
    setScannerTarget(null); setIssueBarcode(''); setIssueEmployee(null); setIssueEmployeePreview(null); setIssueStaffConfirmed(false)
    setIssueToolQuery(''); setIssueCategory('all'); setSelectedToolIds([])
  }

  const resetReturn = () => {
    setScannerTarget(null); setReturnQuery(''); setReturnCategory('all'); setReturnToolId('')
    setReturnCondition('good'); setReturnEmployeeConfirmed(false); setReturnStaffConfirmed(false)
  }

  const requestRepair = (toolId: string, kind: string, note: string): string | null => {
    const tool = tools.find(item => item.id === toolId)
    if (!tool) return 'Багаж бүртгэлээс олдсонгүй.'
    if (tool.status !== 'available' && tool.status !== 'damaged') return 'Зөвхөн бэлэн эсвэл гэмтэлтэй багажийг засварт илгээнэ.'
    const record: RepairRecord = { id: Date.now(), toolId, kind, note, date: new Date().toISOString(), status: 'open' }
    setDemoData(current => ({
      ...current,
      tools: current.tools.map(item => item.id === toolId ? { ...item, status: 'maintenance' } : item),
      repairs: [record, ...current.repairs],
      pendingCount: current.pendingCount + 1,
    }))
    showToast(`${tool.name} засварт илгээгдлээ.`)
    return null
  }

  const finishRepair = (toolId: string) => {
    const tool = tools.find(item => item.id === toolId)
    if (!tool || (tool.status !== 'maintenance' && tool.status !== 'damaged')) return
    const doneDate = new Date().toISOString()
    setDemoData(current => ({
      ...current,
      tools: current.tools.map(item => item.id === toolId ? { ...item, status: 'available' } : item),
      repairs: current.repairs.map(item => item.toolId === toolId && item.status === 'open' ? { ...item, status: 'done', doneDate } : item),
      pendingCount: current.pendingCount + 1,
    }))
    showToast(`${tool.name} засвар дууслаа. Багаж бэлэн боллоо.`)
  }

  const exportCsv = () => {
    const rows = [
      ['Огноо', 'Үйл явдал', 'Ажилтны дугаар', 'Ажилтны нэр', 'Багажны код', 'Нөхцөл'],
      ...filteredEvents.map(event => [dateLabel(event.date), event.type, event.employeeId, employeeById(event.employeeId)?.name ?? '', event.toolIds.map(id => tools.find(tool => tool.id === id)?.code ?? id).join('; '), event.condition ?? '']),
    ]
    const csv = '﻿' + rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'minetool-tuuh.csv'; anchor.click(); URL.revokeObjectURL(url)
    showToast(`${filteredEvents.length} мөрийг CSV файлд татлаа.`)
  }

  const simulateSync = () => {
    if (!online) return showToast('Интернет холболтгүй байна. Холбогдсоны дараа дахин оролдоно уу.', true)
    setDemoData(current => ({ ...current, pendingCount: 0, lastSync: new Date().toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' }) }))
    showToast('Төлөв шинэчлэгдлээ. Сервертэй холбогдоогүй тул өгөгдөл илгээгдээгүй.')
  }

  const countOf = (status: ToolStatus) => tools.filter(tool => tool.status === status).length
  const issuedCount = tools.filter(tool => tool.status === 'issued' || tool.status === 'overdue').length
  const attentionTools = tools.filter(tool => ['overdue', 'damaged', 'lost', 'maintenance'].includes(tool.status))
  const attentionCount = attentionTools.length
  const lastIssueOf = (toolId: string) => events.find(event => event.type === 'Олголт' && event.toolIds.includes(toolId))
  const holders = employees
    .map(employee => ({ employee, held: tools.filter(tool => tool.holderId === employee.id && (tool.status === 'issued' || tool.status === 'overdue')) }))
    .filter(entry => entry.held.length)
    .sort((a, b) => Number(b.held.some(tool => tool.status === 'overdue')) - Number(a.held.some(tool => tool.status === 'overdue')))
  const openFiltered = (status: string) => { setInventoryStatus(status); setInventoryPage(1); changePage('inventory') }
  const startReturnFor = (tool: ToolItem) => { selectReturnTool(tool); changePage('return') }
  const openAttention = (tool: ToolItem) => {
    if (tool.status === 'overdue') startReturnFor(tool)
    else if (tool.status === 'damaged' || tool.status === 'maintenance') changePage('repair')
    else setToolDetailsId(tool.id)
  }
  const activeReturnTool = tools.find(tool => tool.id === returnToolId)
  const activeReturnHolder = employeeById(activeReturnTool?.holderId)
  const activeReturnIssue = activeReturnTool && lastIssueOf(activeReturnTool.id)
  const selectedDetailsTool = tools.find(tool => tool.id === toolDetailsId)
  const issueCandidates = tools.filter(tool => tool.status === 'available' && toolMatches(tool, issueToolQuery, issueCategory))
  const selectedTools = tools.filter(tool => selectedToolIds.includes(tool.id))
  const returnCandidates = tools.filter(tool => (tool.status === 'issued' || tool.status === 'overdue') && tool.holderId
    && toolMatches(tool, returnQuery, returnCategory, employeeById(tool.holderId)?.name ?? ''))
    .sort((a, b) => Number(b.status === 'overdue') - Number(a.status === 'overdue'))
  const tabActive = (id: Page) => tabs.find(tab => tab.id === id)?.match.includes(page) ?? false
  const meta = pageMeta[page]

  const bell = (
    <button className="icon-btn bell" aria-label={`Мэдэгдэл${attentionCount ? `, ${attentionCount} анхаарах` : ''}`} onClick={() => changePage('notifications')}>
      <Bell size={20} />
      {attentionCount > 0 && <i>{attentionCount}</i>}
    </button>
  )
  const net = (
    <span className={`net ${online ? 'is-on' : 'is-off'}`} role="status">
      {online ? <Cloud size={16} /> : <CloudOff size={16} />}
      <span>{online ? 'Онлайн' : 'Офлайн'}</span>
    </span>
  )

  return (
    <div className="shell">
      <aside className="rail" aria-label="Үндсэн цэс">
        <div className="brand">
          <BrandMark />
          <span><strong>MineTool</strong><small>Багажны агуулах</small></span>
        </div>
        <nav className="rail-nav">
          {railGroups.map((group, index) => (
            <div className="rail-group" key={index}>
              {group.map(id => {
                const item = pageMeta[id]
                const Icon = item.icon
                const badge = id === 'sync' ? pendingCount : id === 'notifications' ? attentionCount : 0
                return (
                  <button key={id} className={`rail-link ${page === id ? 'is-active' : ''}`} aria-current={page === id ? 'page' : undefined} onClick={() => changePage(id)}>
                    <Icon size={19} strokeWidth={1.9} />
                    <span>{item.nav}</span>
                    {badge > 0 && <b>{badge}</b>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="rail-foot">
          <span className="demo-flag">Демо өгөгдөл</span>
          <small>Уурхайн өгөгдлийн сантай хараахан холбогдоогүй. Өөрчлөлт зөвхөн энэ төхөөрөмжид хадгалагдана.</small>
        </div>
      </aside>

      <div className="main">
        <header className="appbar">
          <div className="brand"><BrandMark /><strong>MineTool</strong></div>
          <div className="appbar-tools">{net}{bell}</div>
        </header>

        <main className="content">
          <div className="page-head">
            <div className="page-title">
              {morePages.includes(page) && (
                <button className="back-link" onClick={() => changePage('more')}><ChevronLeft size={18} /> Бусад</button>
              )}
              <h1>{meta.title}</h1>
              {page === 'dashboard' && <p>{todayHeading()}</p>}
            </div>
            <div className="page-actions">
              {page === 'inventory' && <button className="btn btn-primary" onClick={() => setDialog('new')}><PackagePlus size={18} /> Багаж нэмэх</button>}
              {page === 'history' && <button className="btn" onClick={exportCsv} disabled={!filteredEvents.length}><Download size={17} /> CSV татах</button>}
              <div className="head-tools">{net}{bell}</div>
            </div>
          </div>

          {!storageAvailable && (
            <div className="notice-bar is-warn" role="alert">
              <AlertTriangle size={18} />
              <span>Энэ хөтөч өгөгдөл хадгалахыг хаасан байна. Хуудсыг дахин ачаалахад өөрчлөлт алга болно.</span>
            </div>
          )}

          {page === 'dashboard' && (
            <div className="home">
              <div className="actions">
                <button className="action is-out" onClick={() => changePage('issue')}>
                  <span className="action-icon"><ScanBarcode size={30} strokeWidth={1.8} /></span>
                  <span className="action-copy"><strong>Багаж олгох</strong><small>Ажилтны үнэмлэхийг уншуулж эхэлнэ</small></span>
                  <ChevronRight className="action-go" size={22} />
                </button>
                <button className="action is-in" onClick={() => changePage('return')}>
                  <span className="action-icon"><ArrowDownToLine size={28} strokeWidth={1.8} /></span>
                  <span className="action-copy"><strong>Багаж буцаах</strong><small>{issuedCount ? `${issuedCount} багаж ажилтнуудын гарт байна` : 'Гарт байгаа багаж алга'}</small></span>
                  <ChevronRight className="action-go" size={22} />
                </button>
              </div>

              <section className="section">
                <div className="section-head">
                  <h2>Агуулахын байдал</h2>
                  <span className="section-note">Нийт {tools.length} багаж</span>
                </div>
                <div className="board stock">
                  <div className="stock-bar" role="img" aria-label={statusOrder.filter(status => countOf(status)).map(status => `${statusLabels[status]} ${countOf(status)}`).join(', ')}>
                    {statusOrder.filter(status => countOf(status)).map(status => (
                      <span key={status} className={`s-${status}`} style={{ flexGrow: countOf(status) }} />
                    ))}
                  </div>
                  <div className="stock-legend">
                    {statusOrder.filter(status => countOf(status)).map(status => (
                      <button key={status} className={`legend s-${status}`} onClick={() => openFiltered(status)}>
                        <i aria-hidden="true" />
                        <span>{statusLabels[status]}</span>
                        <b>{countOf(status)}</b>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <div className="home-grid">
                <section className="section">
                  <div className="section-head">
                    <h2>Хэний гарт юу байна</h2>
                    <span className="section-note">{issuedCount} багаж</span>
                  </div>
                  {holders.length ? (
                    <div className="holders">
                      {holders.map(({ employee, held }) => (
                        <div className="holder" key={employee.id}>
                          <div className="holder-head">
                            <span className="avatar">{initials(employee.name)}</span>
                            <span className="holder-name"><strong>{employee.name}</strong><small>{employee.department}</small></span>
                          </div>
                          <div className="tag-stack">
                            {held.map(tool => {
                              const issued = lastIssueOf(tool.id)
                              return (
                                <ToolTag key={tool.id} tool={tool} onClick={() => startReturnFor(tool)} label={`${tool.name} буцаах`}
                                  meta={issued ? <>Олгосон {shortDate(issued.date)} {timeLabel(issued.date)}</> : undefined} />
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState icon={CheckCircle2} text="Одоогоор бүх багаж агуулахад байна." />}
                </section>

                <section className="section">
                  <div className="section-head">
                    <h2>Анхаарах</h2>
                    <span className="section-note">{attentionCount}</span>
                  </div>
                  {attentionTools.length ? (
                    <div className="tag-stack">
                      {attentionTools.map(tool => (
                        <ToolTag key={tool.id} tool={tool} onClick={() => openAttention(tool)} label={`${tool.name}, ${statusLabels[tool.status]}`}
                          meta={tool.holderId ? <><UserRound size={14} />{employeeById(tool.holderId)?.name}</> : undefined} />
                      ))}
                    </div>
                  ) : <EmptyState icon={CheckCircle2} text="Анхаарах багаж алга. Бүх багаж хэвийн байна." />}
                </section>
              </div>

              <section className="section">
                <div className="section-head">
                  <h2>Сүүлийн бүртгэл</h2>
                  <button className="link-btn" onClick={() => changePage('history')}>Бүх түүх <ChevronRight size={16} /></button>
                </div>
                <LogList events={events.slice(0, 6)} tools={tools} employees={employees} showDate />
              </section>
            </div>
          )}

          {page === 'issue' && (
            <div className="flow">
              <div className="flow-main">
                <section className="step">
                  <StepHead no={1} title="Ажилтан" />
                  {issueEmployee ? (
                    <div className="idcard">
                      <span className="avatar lg">{initials(issueEmployee.name)}</span>
                      <span className="idcard-copy">
                        <strong>{issueEmployee.name}</strong>
                        <span>{issueEmployee.position}</span>
                        <small>{issueEmployee.department}</small>
                      </span>
                      <span className="idcard-code"><small>Үнэмлэх</small><b>{issueEmployee.barcode}</b></span>
                      <button className="btn btn-sm" onClick={changeIssueEmployee}>Солих</button>
                    </div>
                  ) : (
                    <div className="board scan-board">
                      <button className="btn btn-primary btn-lg btn-block" onClick={() => setScannerTarget('employee')}>
                        <ScanBarcode size={22} /> Үнэмлэх уншуулах
                      </button>
                      <div className="or-line"><span>эсвэл кодыг гараар оруулах</span></div>
                      <div className="input-row">
                        <label className="field-icon">
                          <Keyboard size={18} />
                          <input
                            id="employee-barcode"
                            value={issueBarcode}
                            onChange={event => { setIssueBarcode(event.target.value); setIssueEmployeePreview(null) }}
                            onKeyDown={event => event.key === 'Enter' && findIssueEmployee()}
                            placeholder="Баркод эсвэл дугаар"
                            aria-label="Ажилтны баркод эсвэл дугаар"
                            autoComplete="off"
                          />
                        </label>
                        <button className="btn" onClick={findIssueEmployee}>Хайх</button>
                      </div>
                      {issueEmployeePreview && !issueEmployeePreview.active && (
                        <p className="inline-alert"><AlertTriangle size={16} /> {issueEmployeePreview.name} идэвхгүй ажилтан тул багаж олгохгүй.</p>
                      )}
                      <p className="hint">Туршихад: 88001042</p>
                    </div>
                  )}
                </section>

                <section className="step">
                  <StepHead no={2} title="Багаж сонгох" aside={selectedToolIds.length ? `${selectedToolIds.length} сонгосон` : `${issueCandidates.length} бэлэн`} />
                  <div className="finder">
                    <label className="field-icon">
                      <Search size={18} />
                      <input value={issueToolQuery} onChange={event => setIssueToolQuery(event.target.value)} placeholder="Нэр, код, ангиллаар хайх" aria-label="Багаж хайх" />
                    </label>
                    <CategoryChips value={issueCategory} categories={categories} onChange={setIssueCategory} />
                  </div>
                  <div className="tag-list">
                    {issueCandidates.map(tool => {
                      const on = selectedToolIds.includes(tool.id)
                      return (
                        <ToolTag key={tool.id} tool={tool} selected={on} showStatus={false}
                          control={<input type="checkbox" className="sr-only" checked={on} onChange={() => toggleIssueTool(tool.id)} aria-label={`${tool.name} сонгох`} />}
                          aside={<span className="tick" aria-hidden="true"><Check size={18} strokeWidth={3} /></span>} />
                      )
                    })}
                    {!issueCandidates.length && <EmptyState text="Хайлтад тохирох бэлэн багаж алга. Өөр нэр эсвэл ангиллаар хайж үзнэ үү." />}
                  </div>
                </section>
              </div>

              <aside className="ticket" ref={issueTicketRef}>
                <StepHead no={3} title="Баталгаажуулах" />
                <dl className="ticket-rows">
                  <div><dt>Ажилтан</dt><dd>{issueEmployee ? <><strong>{issueEmployee.name}</strong><small>{issueEmployee.id}</small></> : <span className="muted">Үнэмлэх уншуулаагүй</span>}</dd></div>
                  <div><dt>Багаж</dt><dd>{selectedTools.length ? <strong>{selectedTools.length} багаж</strong> : <span className="muted">Сонгоогүй</span>}</dd></div>
                </dl>
                {selectedTools.length > 0 && (
                  <ul className="ticket-list">
                    {selectedTools.map(tool => (
                      <li key={tool.id}>
                        <span className="code">{tool.code}</span>
                        <span className="ticket-name">{tool.name}</span>
                        <button className="icon-btn sm" aria-label={`${tool.name} хасах`} onClick={() => toggleIssueTool(tool.id)}><X size={16} /></button>
                      </li>
                    ))}
                  </ul>
                )}
                <Confirm checked={issueStaffConfirmed} onChange={setIssueStaffConfirmed} title="Эвдрэлгүй, бүрэн бүтэн өгсөн" text="Олгохын өмнө багажийн бүрэн бүтэн байдлыг шалгасан" />
                <button className="btn btn-primary btn-lg btn-block" onClick={confirmIssue} disabled={!issueEmployee || !selectedTools.length || !issueStaffConfirmed}>
                  <CheckCircle2 size={20} /> Олголтыг бүртгэх
                </button>
                {(issueEmployee || selectedTools.length > 0) && <button className="btn btn-quiet btn-block" onClick={resetIssue}><X size={16} /> Цуцлах</button>}
              </aside>

              {selectedTools.length > 0 && !issueTicketVisible && (
                <div className="flow-bar">
                  <span><b>{selectedTools.length} багаж</b><small>{issueEmployee?.name ?? 'Ажилтан сонгоогүй'}</small></span>
                  <button className="btn btn-primary" onClick={() => issueTicketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Үргэлжлүүлэх</button>
                </div>
              )}
            </div>
          )}

          {page === 'return' && (
            <div className="flow">
              <div className="flow-main">
                <section className="step">
                  <StepHead no={1} title="Багаж сонгох" aside={`${returnCandidates.length} гарт байна`} />
                  <div className="finder">
                    <label className="field-icon">
                      <Search size={18} />
                      <input value={returnQuery} onChange={event => setReturnQuery(event.target.value)} placeholder="Багаж эсвэл ажилтны нэрээр хайх" aria-label="Буцаах багаж хайх" autoComplete="off" />
                    </label>
                    <CategoryChips value={returnCategory} categories={categories} onChange={setReturnCategory} />
                  </div>
                  <div className="tag-list">
                    {returnCandidates.map(tool => {
                      const on = returnToolId === tool.id
                      return (
                        <ToolTag key={tool.id} tool={tool} selected={on}
                          control={<input type="radio" name="return-tool" className="sr-only" checked={on} onChange={() => selectReturnTool(tool)} aria-label={`${tool.name} буцаах`} />}
                          meta={<><UserRound size={14} />{employeeById(tool.holderId)?.name ?? 'Тодорхойгүй'}</>}
                          aside={<span className="tick" aria-hidden="true"><Check size={18} strokeWidth={3} /></span>} />
                      )
                    })}
                    {!returnCandidates.length && <EmptyState text={returnQuery || returnCategory !== 'all' ? 'Хайлтад тохирох багаж алга.' : 'Ажилтнуудын гарт буцаах багаж алга.'} />}
                  </div>
                </section>

                {activeReturnTool && (
                  <section className="step">
                    <StepHead no={2} title="Нөхцөл шалгах" />
                    <div className="board holder-strip">
                      <span className="avatar">{activeReturnHolder ? initials(activeReturnHolder.name) : '?'}</span>
                      <span><small>Буцааж буй ажилтан</small><strong>{activeReturnHolder?.name ?? 'Тодорхойгүй'}</strong></span>
                      <span className="holder-when"><small>Олгосон</small><strong>{activeReturnIssue ? dateLabel(activeReturnIssue.date) : '—'}</strong></span>
                    </div>
                    <fieldset className="conditions">
                      <legend className="sr-only">Буцааж буй багажийн нөхцөл</legend>
                      {([
                        ['good', CheckCircle2, 'Бэлэн төлөвт шилжинэ'],
                        ['maintenance', Wrench, 'Засварт шилжиж, засварын бүртгэл нээгдэнэ'],
                        ['damaged', AlertTriangle, 'Гэмтэлтэй гэж тэмдэглэж, засварын бүртгэл нээгдэнэ'],
                      ] as [Condition, LucideIcon, string][]).map(([condition, Icon, result]) => (
                        <label key={condition} className={`condition c-${condition} ${returnCondition === condition ? 'is-on' : ''}`}>
                          <input type="radio" className="sr-only" name="condition" value={condition} checked={returnCondition === condition} onChange={() => setReturnCondition(condition)} />
                          <span className="condition-icon"><Icon size={22} /></span>
                          <span className="condition-copy"><strong>{conditionLabels[condition]}</strong><small>{result}</small></span>
                        </label>
                      ))}
                    </fieldset>
                  </section>
                )}
              </div>

              <aside className="ticket" ref={returnTicketRef}>
                <StepHead no={activeReturnTool ? 3 : 2} title="Баталгаажуулах" />
                <dl className="ticket-rows">
                  <div><dt>Багаж</dt><dd>{activeReturnTool ? <><strong>{activeReturnTool.name}</strong><small>{activeReturnTool.code}</small></> : <span className="muted">Сонгоогүй</span>}</dd></div>
                  <div><dt>Ажилтан</dt><dd>{activeReturnHolder ? <strong>{activeReturnHolder.name}</strong> : <span className="muted">—</span>}</dd></div>
                  <div><dt>Нөхцөл</dt><dd><strong>{conditionLabels[returnCondition]}</strong></dd></div>
                </dl>
                <Confirm checked={returnEmployeeConfirmed} disabled={!activeReturnTool} onChange={setReturnEmployeeConfirmed} title="Ажилтан буцааж өгсөн" text="Багажийг эзэмшигч нь өөрөө хүлээлгэж өгсөн" />
                <Confirm checked={returnStaffConfirmed} disabled={!activeReturnTool} onChange={setReturnStaffConfirmed} title="Нөхцөлийг шалгасан" text="Агуулахын ажилтан багажийг үзэж шалгасан" />
                <button className="btn btn-primary btn-lg btn-block" onClick={confirmReturn} disabled={!activeReturnTool || !returnEmployeeConfirmed || !returnStaffConfirmed}>
                  <CheckCircle2 size={20} /> Буцаалтыг бүртгэх
                </button>
                {activeReturnTool && <button className="btn btn-quiet btn-block" onClick={resetReturn}><X size={16} /> Цуцлах</button>}
              </aside>

              {activeReturnTool && !returnTicketVisible && (
                <div className="flow-bar">
                  <span><b>{activeReturnTool.code}</b><small>{conditionLabels[returnCondition]}</small></span>
                  <button className="btn btn-primary" onClick={() => returnTicketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Үргэлжлүүлэх</button>
                </div>
              )}
            </div>
          )}

          {page === 'repair' && (
            <RepairView tools={tools} repairs={repairs} onRequest={requestRepair} onFinish={finishRepair} />
          )}

          {page === 'notifications' && (
            <NotificationsView
              tools={tools}
              events={events}
              employees={employees}
              pendingCount={pendingCount}
              onGo={target => (target === 'inventory' ? openFiltered('all') : changePage(target))}
            />
          )}

          {page === 'more' && (
            <MoreView attentionCount={attentionCount} pendingCount={pendingCount} repairCount={tools.filter(tool => tool.status === 'maintenance' || tool.status === 'damaged').length} onGo={changePage} />
          )}

          {page === 'inventory' && (
            <div className="records">
              <div className="finder finder-row">
                <label className="field-icon">
                  <Search size={18} />
                  <input value={inventorySearch} onChange={event => { setInventorySearch(event.target.value); setInventoryPage(1) }} placeholder="Нэр, код, эзэмшигчээр хайх" aria-label="Багаж хайх" />
                </label>
                <label className="select">
                  <span className="sr-only">Ангилал</span>
                  <select value={inventoryCategory} onChange={event => { setInventoryCategory(event.target.value); setInventoryPage(1) }}>
                    <option value="all">Бүх ангилал</option>
                    {categories.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ChevronDown size={16} />
                </label>
              </div>
              <div className="chips" role="radiogroup" aria-label="Багажийн төлөв">
                {(['all', ...statusOrder.filter(status => status !== 'retired' || countOf('retired'))] as string[]).map(value => (
                  <button key={value} type="button" role="radio" aria-checked={inventoryStatus === value} className={`fchip ${inventoryStatus === value ? 'is-on' : ''}`} onClick={() => { setInventoryStatus(value); setInventoryPage(1) }}>
                    {value === 'all' ? 'Бүгд' : statusLabels[value as ToolStatus]}
                    <b>{value === 'all' ? tools.length : countOf(value as ToolStatus)}</b>
                  </button>
                ))}
              </div>
              {pageTools.length ? (
                <div className="tag-grid">
                  {pageTools.map(tool => {
                    const holder = employeeById(tool.holderId)
                    return (
                      <ToolTag key={tool.id} tool={tool} onOpen={() => setToolDetailsId(tool.id)}
                        meta={<><span className="meta-item"><CategoryIcon category={tool.category} size={14} />{tool.category}</span>{holder && <span className="meta-item"><UserRound size={14} />{holder.name}</span>}</>}
                        aside={<>
                          {toolPhotoUrls[tool.id] && <ToolPhotoThumb src={toolPhotoUrls[tool.id]} alt={`${tool.name} зураг`} onClick={() => setPhotoViewerToolId(tool.id)} />}
                          <button className="icon-btn" aria-label={`${tool.code} засах`} onClick={() => setDialog(tool)}><Pencil size={17} /></button>
                        </>} />
                    )
                  })}
                </div>
              ) : <EmptyState text="Шүүлтэд тохирох багаж алга. Хайлтаа өөрчилж эсвэл шинэ багаж нэмнэ үү." />}
              {filteredTools.length > pageSize && (
                <div className="pager">
                  <span>{(inventoryPage - 1) * pageSize + 1}–{Math.min(inventoryPage * pageSize, filteredTools.length)} / {filteredTools.length}</span>
                  <div>
                    <button className="icon-btn" aria-label="Өмнөх хуудас" disabled={inventoryPage <= 1} onClick={() => setInventoryPage(value => value - 1)}><ChevronLeft size={18} /></button>
                    <span>{inventoryPage} / {pageCount}</span>
                    <button className="icon-btn" aria-label="Дараах хуудас" disabled={inventoryPage >= pageCount} onClick={() => setInventoryPage(value => value + 1)}><ChevronRight size={18} /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {page === 'employees' && (
            <div className="records">
              <div className="finder finder-row">
                <label className="field-icon">
                  <Search size={18} />
                  <input value={employeeSearch} onChange={event => setEmployeeSearch(event.target.value)} placeholder="Нэр, дугаар, баркод, хэлтсээр хайх" aria-label="Ажилтан хайх" />
                </label>
                <div className="chips" role="radiogroup" aria-label="Ажилтны төлөв">
                  {([['all', 'Бүгд'], ['true', 'Идэвхтэй'], ['false', 'Идэвхгүй']] as [string, string][]).map(([value, label]) => (
                    <button key={value} type="button" role="radio" aria-checked={employeeFilter === value} className={`fchip ${employeeFilter === value ? 'is-on' : ''}`} onClick={() => setEmployeeFilter(value)}>{label}</button>
                  ))}
                </div>
              </div>
              {filteredEmployees.length ? (
                <div className="board people">
                  <div className="people-row people-head" aria-hidden="true">
                    <span>Ажилтан</span><span>Хэлтэс</span><span>Үнэмлэх</span><span>Гарт байгаа</span><span>Төлөв</span>
                  </div>
                  {filteredEmployees.map(employee => {
                    const held = tools.filter(tool => tool.holderId === employee.id).length
                    return (
                      <div className="people-row" key={employee.id}>
                        <span className="person">
                          <span className="avatar">{initials(employee.name)}</span>
                          <span><strong>{employee.name}</strong><small>{employee.position}</small></span>
                        </span>
                        <span className="person-dept">{employee.department}</span>
                        <span className="person-badge"><b>{employee.barcode}</b><small>{employee.id}</small></span>
                        <span className="person-held">{held ? `${held} багаж` : <span className="muted">—</span>}</span>
                        <span className={`state ${employee.active ? 'is-on' : 'is-off'}`}>{employee.active ? 'Идэвхтэй' : 'Идэвхгүй'}</span>
                      </div>
                    )
                  })}
                </div>
              ) : <EmptyState text="Хайлтад тохирох ажилтан алга." />}
              <p className="footnote">Жишээ ажилтнууд. Хүний нөөцийн системтэй холбогдсоны дараа бодит жагсаалт харагдана.</p>
            </div>
          )}

          {page === 'history' && (
            <div className="records">
              <div className="finder finder-wrap">
                <label className="field-icon">
                  <Search size={18} />
                  <input value={historySearch} onChange={event => setHistorySearch(event.target.value)} placeholder="Ажилтан, багажийн нэр эсвэл код" aria-label="Түүх хайх" />
                </label>
                <div className="chips" role="radiogroup" aria-label="Үйл явдлын төрөл">
                  {([['all', 'Бүгд'], ['Олголт', 'Олголт'], ['Буцаалт', 'Буцаалт']] as [string, string][]).map(([value, label]) => (
                    <button key={value} type="button" role="radio" aria-checked={historyType === value} className={`fchip ${historyType === value ? 'is-on' : ''}`} onClick={() => setHistoryType(value)}>{label}</button>
                  ))}
                </div>
                <div className="date-range">
                  <label><span>Эхлэх</span><input type="date" value={historyFrom} onChange={event => setHistoryFrom(event.target.value)} /></label>
                  <label><span>Дуусах</span><input type="date" value={historyTo} onChange={event => setHistoryTo(event.target.value)} /></label>
                </div>
              </div>
              <p className="result-line">{filteredEvents.length} бүртгэл</p>
              {historyGroups.length ? historyGroups.map(group => (
                <section className="log-day" key={group.key}>
                  <h2>{dayHeading(group.date)}<span>{shortDate(group.date)}</span></h2>
                  <LogList events={group.items} tools={tools} employees={employees} />
                </section>
              )) : <EmptyState text="Сонгосон шүүлтэд бүртгэл алга." />}
            </div>
          )}

          {page === 'sync' && (
            <div className="records sync">
              <section className="board sync-state">
                <span className={`sync-light ${online ? 'is-on' : 'is-off'}`}>{online ? <Cloud size={24} /> : <CloudOff size={24} />}</span>
                <div>
                  <h2>{online ? 'Интернет холболт байна' : 'Интернет холболт алга'}</h2>
                  <p>Энэ нь зөвхөн төхөөрөмжийн холболт. Уурхайн сервертэй холбогдоогүй байна.</p>
                </div>
              </section>
              <dl className="board facts">
                <div><dt>Сүүлд шинэчилсэн</dt><dd>{lastSync}</dd></div>
                <div><dt>Илгээгдээгүй үйлдэл</dt><dd>{pendingCount}</dd></div>
                <div><dt>Өгөгдлийн сан</dt><dd className="is-bad">Холбогдоогүй</dd></div>
              </dl>
              <button className="btn btn-primary btn-lg" onClick={simulateSync} disabled={!pendingCount && online}><RefreshCw size={18} /> Төлөв шинэчлэх</button>
              <section className="section">
                <div className="section-head"><h2>Илгээгдээгүй үйлдлүүд</h2><span className="section-note">{pendingCount}</span></div>
                {pendingCount ? (
                  <ol className="board plain-list">
                    {events.slice(0, pendingCount).map(event => (
                      <li key={event.id}>
                        <span className={`log-type ${event.type === 'Олголт' ? 'is-out' : 'is-in'}`}>{event.type}</span>
                        <span>{event.toolIds.map(id => tools.find(tool => tool.id === id)?.code ?? id).join(', ')}</span>
                        <time>{dateLabel(event.date)}</time>
                      </li>
                    ))}
                  </ol>
                ) : <EmptyState icon={CheckCircle2} text="Бүх үйлдэл шинэчлэгдсэн." />}
              </section>
              <p className="footnote">Үйлдлүүд энэ төхөөрөмжийн санах ойд хадгалагдана. Уурхайн өгөгдлийн сантай холбогдсоны дараа автоматаар илгээгдэнэ.</p>
            </div>
          )}

          {page === 'settings' && (
            <div className="records">
              <section className="section">
                <div className="section-head"><h2>Апп</h2></div>
                <dl className="board facts rows">
                  <div><dt>Нэр</dt><dd>MineTool</dd></div>
                  <div><dt>Хэл</dt><dd>Монгол</dd></div>
                  <div><dt>Хувилбар</dt><dd>Демо 1.0</dd></div>
                </dl>
              </section>
              <section className="section">
                <div className="section-head"><h2>Өгөгдөл</h2></div>
                <dl className="board facts rows">
                  <div><dt>Ажилтны мэдээлэл</dt><dd>Жишээ өгөгдөл</dd></div>
                  <div><dt>Багажийн мэдээлэл</dt><dd>Жишээ өгөгдөл</dd></div>
                  <div><dt>Хадгалах газар</dt><dd className={storageAvailable ? '' : 'is-bad'}>{storageAvailable ? 'Энэ төхөөрөмж' : 'Хадгалах боломжгүй'}</dd></div>
                  <div><dt>Уурхайн өгөгдлийн сан</dt><dd className="is-bad">Холбогдоогүй</dd></div>
                </dl>
              </section>
              <div className="notice-bar">
                <CircleHelp size={18} />
                <span>Бодит ажилтны жагсаалт, хэрэглэгчийн эрх, сервертэй холболт дараагийн шатанд нэмэгдэнэ.</span>
              </div>
            </div>
          )}
        </main>
      </div>

      <nav className="tabbar" aria-label="Үндсэн цэс">
        {tabs.map(tab => {
          const item = pageMeta[tab.id]
          const Icon = item.icon
          const active = tabActive(tab.id)
          return (
            <button key={tab.id} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined} onClick={() => changePage(tab.id)}>
              <span className="tab-icon"><Icon size={22} strokeWidth={active ? 2.2 : 1.9} /></span>
              <span>{item.nav}</span>
            </button>
          )
        })}
      </nav>

      {scannerTarget && (
        <CameraScanner
          title="Ажилтны үнэмлэх уншуулах"
          instruction="Үнэмлэх дээрх баркодыг хүрээ дотор байрлуулна уу."
          onDetected={value => { acceptEmployeeCode(value); setScannerTarget(null) }}
          onClose={() => setScannerTarget(null)}
        />
      )}
      {photoViewerToolId && (
        <ToolPhotoViewer tool={tools.find(tool => tool.id === photoViewerToolId)} onClose={() => setPhotoViewerToolId(null)} />
      )}
      {selectedDetailsTool && (
        <ToolDetailsDialog
          tool={selectedDetailsTool}
          holder={employeeById(selectedDetailsTool.holderId)}
          photoUrl={toolPhotoUrls[selectedDetailsTool.id]}
          events={events.filter(event => event.toolIds.includes(selectedDetailsTool.id))}
          employees={employees}
          tools={tools}
          onEdit={() => { setToolDetailsId(null); setDialog(selectedDetailsTool) }}
          onClose={() => setToolDetailsId(null)}
        />
      )}
      {toast && (
        <div key={toast.id} className={`toast ${toast.error ? 'is-error' : ''}`} role={toast.error ? 'alert' : 'status'}>
          {toast.error ? <AlertTriangle size={19} /> : <CheckCircle2 size={19} />}
          <span>{toast.text}</span>
          <button className="icon-btn sm" aria-label="Хаах" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}
      {dialog && (
        <ToolDialog
          tool={dialog === 'new' ? undefined : dialog}
          photoKey={dialog === 'new' ? undefined : dialog.photoKey}
          categories={categories}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          existingCodes={tools.filter(item => dialog === 'new' || item.id !== dialog.id).map(item => item.code)}
          onClose={() => setDialog(null)}
          onSave={async (tool, photoChange, isNew) => {
            const existingTool = tools.find(item => item.id === tool.id)
            if (isNew && existingTool) throw new Error('Багажийн дугаар давхардсан байна. Дахин оролдоно уу.')
            if (!isNew && !existingTool) throw new Error('Багаж бүртгэлээс олдсонгүй. Жагсаалтыг шинэчлээд дахин оролдоно уу.')
            try {
              if (photoChange.file) await saveToolPhoto(tool.id, photoChange.file)
              else if (photoChange.remove) await deleteToolPhoto(tool.id)
              setDemoData(current => ({
                ...current,
                tools: isNew ? [...current.tools, tool] : current.tools.map(item => item.id === tool.id ? tool : item),
              }))
              showToast(isNew ? `${tool.code} бүртгэлд нэмэгдлээ.` : `${tool.code} хадгалагдлаа.`)
            } catch (error) {
              if (error instanceof Error && error.message.startsWith('Багаж')) throw error
              throw new Error('Зургийг энэ төхөөрөмжид хадгалж чадсангүй. Хадгалах зайг шалгаад дахин оролдоно уу.')
            }
          }}
        />
      )}
    </div>
  )
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 36 36" aria-hidden="true">
      <path d="M12 5h17a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H12l-8-8V13z" fill="var(--hivis)" />
      <circle cx="11.5" cy="18" r="3" fill="var(--rail)" />
      <path d="M18 13h9M18 18h9M18 23h6" stroke="var(--rail)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function StepHead({ no, title, aside }: { no: number; title: string; aside?: string }) {
  return (
    <header className="step-head">
      <span className="step-no" aria-hidden="true">{no}</span>
      <h2>{title}</h2>
      {aside && <span className="step-aside">{aside}</span>}
    </header>
  )
}

function CategoryChips({ value, categories, onChange }: { value: string; categories: string[]; onChange: (value: string) => void }) {
  return (
    <div className="chips" role="radiogroup" aria-label="Ангилал">
      {['all', ...categories].map(item => (
        <button key={item} type="button" role="radio" aria-checked={value === item} className={`fchip ${value === item ? 'is-on' : ''}`} onClick={() => onChange(item)}>
          {item === 'all' ? 'Бүх ангилал' : item}
        </button>
      ))}
    </div>
  )
}

function Confirm({ checked, onChange, title, text, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; title: string; text: string; disabled?: boolean }) {
  return (
    <label className={`confirm ${checked ? 'is-on' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
      <span className="confirm-box" aria-hidden="true"><Check size={16} strokeWidth={3} /></span>
      <span><strong>{title}</strong><small>{text}</small></span>
    </label>
  )
}

function LogList({ events, tools, employees, showDate = false }: { events: EventRecord[]; tools: ToolItem[]; employees: Employee[]; showDate?: boolean }) {
  if (!events.length) return <EmptyState text="Бүртгэл алга." />
  return (
    <ol className={`board log ${showDate ? 'with-date' : ''}`}>
      {events.map(event => {
        const employee = employees.find(person => person.id === event.employeeId)
        const items = event.toolIds.map(id => tools.find(tool => tool.id === id))
        const out = event.type === 'Олголт'
        return (
          <li className="log-row" key={event.id}>
            <time>{showDate && dayKey(event.date) !== dayKey(new Date()) ? `${shortDate(event.date).slice(5)} ` : ''}{timeLabel(event.date)}</time>
            <span className={`log-type ${out ? 'is-out' : 'is-in'}`}>{out ? <ArrowUpFromLine size={14} /> : <ArrowDownToLine size={14} />}{event.type}</span>
            <span className="log-tools">
              {items.map((tool, index) => (
                <span key={tool?.id ?? index}><b className="code">{tool?.code ?? event.toolIds[index]}</b>{tool?.name ?? 'Устгагдсан багаж'}</span>
              ))}
            </span>
            <span className="log-person">{employee?.name ?? event.employeeId}</span>
            <span className={`log-cond ${event.condition && event.condition !== 'Хэвийн' ? 'is-bad' : ''}`}>{event.condition ?? ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

function EmptyState({ text, icon: Icon = Search }: { text: string; icon?: LucideIcon }) {
  return <div className="empty"><Icon size={20} /><span>{text}</span></div>
}

function ToolPhotoThumb({ src, alt, onClick }: { src?: string; alt: string; onClick?: () => void }) {
  const contents = src ? <img src={src} alt={alt} loading="lazy" /> : <ImageIcon size={18} />
  if (onClick) return <button type="button" className="thumb" aria-label={`${alt} томоор харах`} onClick={onClick}>{contents}</button>
  return <span className="thumb">{contents}</span>
}

function Overlay({ onClose, children, labelledBy, className = '', as = 'section', onSubmit }: { onClose: () => void; children: ReactNode; labelledBy: string; className?: string; as?: 'section' | 'form'; onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('has-overlay')
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('has-overlay') }
  }, [])
  const cls = `dialog ${className}`
  return (
    <div className="overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      {as === 'form'
        ? <form className={cls} role="dialog" aria-modal="true" aria-labelledby={labelledBy} onSubmit={onSubmit}>{children}</form>
        : <section className={cls} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>{children}</section>}
    </div>
  )
}

function DialogHead({ id, title, onClose }: { id: string; title: string; onClose: () => void }) {
  return (
    <header className="dialog-head">
      <h2 id={id}>{title}</h2>
      <button type="button" className="icon-btn" aria-label="Хаах" onClick={onClose}><X size={20} /></button>
    </header>
  )
}

function ToolPhotoViewer({ tool, onClose }: { tool?: ToolItem; onClose: () => void }) {
  const [photoUrl, setPhotoUrl] = useState<string>()
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    if (!tool?.photoKey) return () => { active = false }
    void getToolPhoto(tool.id, 'original').then(photo => {
      if (!active) return
      if (!photo) { setError(true); return }
      objectUrl = URL.createObjectURL(photo)
      setPhotoUrl(objectUrl)
    }).catch(() => { if (active) setError(true) })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [tool?.id, tool?.photoKey])

  return (
    <Overlay onClose={onClose} labelledBy="photo-title" className="photo-dialog">
      <DialogHead id="photo-title" title={tool ? `${tool.code} ${tool.name}` : 'Багажийн зураг'} onClose={onClose} />
      {photoUrl
        ? <img className="photo-full" src={photoUrl} alt={`${tool?.name ?? 'Багаж'} бүрэн зураг`} />
        : <div className="empty"><ImageIcon size={22} /><span>{error ? 'Зургийг уншиж чадсангүй.' : 'Зураг ачаалж байна…'}</span></div>}
    </Overlay>
  )
}

function ToolDetailsDialog({ tool, holder, photoUrl, events, employees, tools, onEdit, onClose }: { tool: ToolItem; holder?: Employee; photoUrl?: string; events: EventRecord[]; employees: Employee[]; tools: ToolItem[]; onEdit: () => void; onClose: () => void }) {
  return (
    <Overlay onClose={onClose} labelledBy="tool-details-title">
      <DialogHead id="tool-details-title" title={tool.name} onClose={onClose} />
      <div className="dialog-body">
        {photoUrl && <img className="details-photo" src={photoUrl} alt={`${tool.name} зураг`} />}
        <ToolTag tool={tool} className="tag-lg" />
        <dl className="facts rows">
          <div><dt>Эзэмшигч</dt><dd>{holder ? holder.name : <span className="muted">Агуулахад</span>}</dd></div>
        </dl>
        <h3 className="dialog-sub">Сүүлийн хөдөлгөөн</h3>
        <LogList events={events.slice(0, 5)} tools={tools} employees={employees} showDate />
      </div>
      <footer className="dialog-foot">
        <button type="button" className="btn" onClick={onClose}>Хаах</button>
        <button type="button" className="btn btn-primary" onClick={onEdit}><Pencil size={16} /> Засах</button>
      </footer>
    </Overlay>
  )
}

function ToolDialog({
  tool,
  photoKey,
  existingCodes,
  categories,
  onAddCategory,
  onRemoveCategory,
  onClose,
  onSave,
}: {
  tool?: ToolItem
  photoKey?: string
  existingCodes: string[]
  categories: string[]
  onAddCategory: (name: string) => { name?: string; error?: string }
  onRemoveCategory: (name: string) => { error?: string }
  onClose: () => void
  onSave: (tool: ToolItem, photoChange: ToolPhotoChange, isNew: boolean) => Promise<void>
}) {
  const isNew = !tool
  const [code, setCode] = useState(tool?.code ?? '')
  const [name, setName] = useState(tool?.name ?? '')
  const [category, setCategory] = useState(tool?.category ?? categories[0] ?? '')
  const [newCategory, setNewCategory] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [manageCategories, setManageCategories] = useState(false)
  const [status, setStatus] = useState<ToolStatus>(tool?.status ?? 'available')
  const [selectedPhoto, setSelectedPhoto] = useState<File>()
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>()
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string>()
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoLoadError, setPhotoLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    setPhotoLoadError(false)
    if (!tool?.photoKey) {
      setExistingPhotoUrl(undefined)
      return () => { active = false }
    }
    void getToolPhoto(tool.id, 'original').then(photo => {
      if (!photo) {
        if (active) setPhotoLoadError(true)
        return
      }
      objectUrl = URL.createObjectURL(photo)
      if (active) setExistingPhotoUrl(objectUrl)
      else URL.revokeObjectURL(objectUrl)
    }).catch(() => { if (active) setPhotoLoadError(true) })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [tool?.id, tool?.photoKey])

  useEffect(() => {
    if (!selectedPhoto) {
      setSelectedPhotoUrl(undefined)
      return
    }
    const objectUrl = URL.createObjectURL(selectedPhoto)
    setSelectedPhotoUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedPhoto])

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setPhotoError('')
    if (file.size > maxToolPhotoBytes) {
      setPhotoError('Зургийн хэмжээ 5 МБ-аас их байна. Жижиг зураг сонгоно уу.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
      setPhotoError('Зөвхөн JPEG, PNG эсвэл WebP зураг сонгоно уу.')
      return
    }
    try {
      const bitmap = await createImageBitmap(file)
      bitmap.close()
    } catch {
      setPhotoError('Зургийн файл уншигдахгүй байна. Өөр зураг сонгоно уу.')
      return
    }
    setSelectedPhoto(file)
    setPhotoRemoved(false)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setError('')
    if (!code.trim() || !name.trim() || !category.trim()) {
      setError('Код, нэр, ангиллыг бөглөнө үү.')
      return
    }
    if (existingCodes.some(existingCode => existingCode.toUpperCase() === code.trim().toUpperCase())) {
      setError(`${code.trim().toUpperCase()} код бүртгэлтэй байна. Өөр код оруулна уу.`)
      return
    }
    if ((status === 'issued' || status === 'overdue') && !tool?.holderId) {
      setError('Эзэмшигчгүй багажийг "Олгосон" болгох боломжгүй. Олголтыг "Олгох" хэсгээр хийнэ үү.')
      return
    }
    const id = tool?.id ?? `tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const nextTool: ToolItem = {
      id,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      status,
      holderId: status === 'issued' || status === 'overdue' ? tool?.holderId : undefined,
      photoKey: selectedPhoto ? id : photoRemoved ? undefined : photoKey,
    }
    setSaving(true)
    try {
      await onSave(nextTool, { file: selectedPhoto, remove: !selectedPhoto && photoRemoved && Boolean(photoKey) }, isNew)
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Багажийн мэдээллийг хадгалж чадсангүй.')
    } finally {
      setSaving(false)
    }
  }
  const handleAddCategory = () => {
    const result = onAddCategory(newCategory)
    if (result.error || !result.name) { setCategoryError(result.error ?? 'Ангилал нэмэх боломжгүй байна.'); return }
    setCategory(result.name)
    setNewCategory('')
    setCategoryError('')
  }
  const handleRemoveCategory = (item: string) => {
    const result = onRemoveCategory(item)
    if (result.error) { setCategoryError(result.error); return }
    setCategoryError('')
    if (category === item) setCategory(categories.find(other => other !== item) ?? '')
  }

  const displayedPhotoUrl = selectedPhotoUrl ?? (photoRemoved ? undefined : existingPhotoUrl)
  const hasPhoto = Boolean(displayedPhotoUrl || (photoKey && !photoRemoved))

  return (
    <Overlay onClose={onClose} labelledBy="tool-dialog-title" as="form" onSubmit={submit}>
      <DialogHead id="tool-dialog-title" title={isNew ? 'Шинэ багаж' : `${tool?.code} засах`} onClose={onClose} />
      <div className="dialog-body form">
        <div className="form-grid">
          <label className="field">
            <span>Код</span>
            <input autoFocus={isNew} value={code} onChange={event => setCode(event.target.value)} placeholder="DRL-0260" maxLength={24} className="code-input" />
          </label>
          <label className="field">
            <span>Төлөв</span>
            <span className="select">
              <select value={status} onChange={event => setStatus(event.target.value as ToolStatus)}>
                {statusOrder.map(value => <option value={value} key={value}>{statusLabels[value]}</option>)}
              </select>
              <ChevronDown size={16} />
            </span>
          </label>
        </div>
        <label className="field">
          <span>Нэр</span>
          <input value={name} onChange={event => setName(event.target.value)} placeholder="Жишээ: Цохилтот дрилл" maxLength={80} />
        </label>
        <div className="field">
          <span className="field-label-row">
            <label htmlFor="tool-category">Ангилал</label>
            <button type="button" className="link-btn" onClick={() => setManageCategories(value => !value)}>{manageCategories ? 'Болсон' : 'Ангилал засах'}</button>
          </span>
          <span className="select">
            <select id="tool-category" value={category} onChange={event => setCategory(event.target.value)}>
              {categories.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <ChevronDown size={16} />
          </span>
          {manageCategories && (
            <div className="category-box">
              <ul className="cat-list" aria-label="Ангиллууд">
                {categories.map(item => (
                  <li key={item}>
                    <span>{item}</span>
                    <button type="button" className="icon-btn sm" aria-label={`${item} ангиллыг хасах`} onClick={() => handleRemoveCategory(item)}><Trash2 size={15} /></button>
                  </li>
                ))}
              </ul>
              <div className="input-row">
                <input
                  value={newCategory}
                  onChange={event => { setNewCategory(event.target.value); setCategoryError('') }}
                  onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); handleAddCategory() } }}
                  placeholder="Шинэ ангиллын нэр"
                  aria-label="Шинэ ангиллын нэр"
                  maxLength={50}
                />
                <button type="button" className="btn" onClick={handleAddCategory}><Plus size={16} /> Нэмэх</button>
              </div>
            </div>
          )}
          {categoryError && <p className="form-error"><AlertTriangle size={15} />{categoryError}</p>}
        </div>
        <div className="field">
          <span>Зураг <em>заавал биш</em></span>
          <div className={`photo-box ${displayedPhotoUrl ? 'has-photo' : ''}`}>
            {displayedPhotoUrl
              ? <img src={displayedPhotoUrl} alt="Багажийн зураг" />
              : <span className="photo-empty"><ImageIcon size={24} />{photoLoadError ? 'Өмнөх зургийг уншиж чадсангүй' : photoKey && !photoRemoved ? 'Ачаалж байна…' : 'Зураг хавсаргаагүй'}</span>}
          </div>
          <div className="photo-actions">
            <input ref={cameraInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handlePhotoSelection} aria-label="Камераар зураг авах" tabIndex={-1} />
            <input ref={galleryInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelection} aria-label="Зураг сонгох" tabIndex={-1} />
            <button type="button" className="btn btn-sm" onClick={() => cameraInputRef.current?.click()}><Camera size={16} /> Зураг авах</button>
            <button type="button" className="btn btn-sm" onClick={() => galleryInputRef.current?.click()}><ImageIcon size={16} /> {hasPhoto ? 'Солих' : 'Файлаас'}</button>
            {hasPhoto && <button type="button" className="btn btn-sm btn-danger" onClick={() => { setSelectedPhoto(undefined); setPhotoRemoved(true); setPhotoError('') }}><Trash2 size={15} /> Устгах</button>}
          </div>
          {photoError && <p className="form-error"><AlertTriangle size={15} />{photoError}</p>}
          <small className="field-note">5 МБ хүртэл. Зураг зөвхөн энэ төхөөрөмжид хадгалагдана.</small>
        </div>
        {error && <p className="form-error"><AlertTriangle size={15} />{error}</p>}
      </div>
      <footer className="dialog-foot">
        <button type="button" className="btn" onClick={onClose}>Болих</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Check size={17} /> {saving ? 'Хадгалж байна…' : isNew ? 'Нэмэх' : 'Хадгалах'}
        </button>
      </footer>
    </Overlay>
  )
}

export default App
