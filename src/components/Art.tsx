import { useEffect, useState } from 'react'
import { Droplets, Flame, Hammer, Package, Ruler, Wrench, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* Уурхайн техникийн векторон дүрслэл (өөрийн зурсан, ерөнхий загвар). */

export function ExcavatorArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 430 290" role="img" aria-label="Экскаватор" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="exc-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb13b" />
          <stop offset="1" stopColor="#ff6a00" />
        </linearGradient>
        <linearGradient id="exc-boom" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffa72f" />
          <stop offset="1" stopColor="#f55f00" />
        </linearGradient>
        <linearGradient id="exc-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe3ff" />
          <stop offset="1" stopColor="#3b6d9c" />
        </linearGradient>
        <linearGradient id="exc-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#59627f" />
          <stop offset="1" stopColor="#262d45" />
        </linearGradient>
      </defs>
      <ellipse cx="170" cy="268" rx="165" ry="9" fill="#000" opacity=".35" />
      {/* Гинж */}
      <rect x="36" y="206" width="262" height="58" rx="29" fill="#10152a" />
      <rect x="44" y="214" width="246" height="42" rx="21" fill="none" stroke="#2f3a62" strokeWidth="3" strokeDasharray="7 5" />
      {[[70, 235, 16], [266, 235, 16]].map(([x, y, r]) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} fill="#1e2646" stroke="#3b4776" strokeWidth="3" />
          <circle cx={x} cy={y} r="5" fill="#ff8a1f" />
        </g>
      ))}
      {[112, 152, 192, 232].map((x) => (
        <circle key={x} cx={x} cy={x % 80 === 32 ? 247 : 249} r="7.5" fill="#1e2646" stroke="#3b4776" strokeWidth="2" />
      ))}
      <rect x="86" y="190" width="172" height="22" rx="6" fill="#232b4a" />
      <rect x="76" y="180" width="192" height="14" rx="5" fill="#2e3860" />
      {/* Хөдөлгүүрийн хэсэг */}
      <rect x="50" y="118" width="124" height="66" rx="15" fill="url(#exc-body)" />
      <path d="M62 132 H162 M62 146 H162 M62 160 H162" stroke="#b84800" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <rect x="90" y="96" width="8" height="26" rx="3" fill="#161b30" />
      {/* Кабин */}
      <path d="M170 184 V98 Q170 88 180 88 H228 Q237 88 241 97 L256 150 V184 Z" fill="url(#exc-body)" />
      <path d="M180 99 H224 L240 142 H180 Z" fill="url(#exc-glass)" />
      <path d="M186 104 H208 L196 138 H186 Z" fill="#fff" opacity=".28" />
      <rect x="168" y="84" width="76" height="7" rx="3.5" fill="#d85300" />
      <rect x="176" y="150" width="76" height="28" rx="6" fill="#ff8a1f" opacity=".9" />
      {/* Хөл ба хуруу (boom, arm, bucket) */}
      <path d="M244 160 Q292 100 338 62" stroke="#a63b00" strokeWidth="26" strokeLinecap="round" fill="none" />
      <path d="M244 160 Q292 100 338 62" stroke="url(#exc-boom)" strokeWidth="21" strokeLinecap="round" fill="none" />
      <path d="M338 62 L384 140" stroke="#a63b00" strokeWidth="20" strokeLinecap="round" fill="none" />
      <path d="M338 62 L384 140" stroke="url(#exc-boom)" strokeWidth="15" strokeLinecap="round" fill="none" />
      <path d="M262 132 L304 84" stroke="#dfe5f2" strokeWidth="8" strokeLinecap="round" />
      <path d="M262 132 L304 84" stroke="#8d98b6" strokeWidth="3" strokeLinecap="round" />
      <path d="M312 58 L360 84" stroke="#dfe5f2" strokeWidth="8" strokeLinecap="round" />
      <path d="M312 58 L360 84" stroke="#8d98b6" strokeWidth="3" strokeLinecap="round" />
      <path d="M362 100 L398 128" stroke="#dfe5f2" strokeWidth="6" strokeLinecap="round" />
      <path d="M366 138 L404 120 Q420 150 410 176 Q394 190 372 180 Z" fill="url(#exc-steel)" stroke="#6b7596" strokeWidth="2" strokeLinejoin="round" />
      <path d="M372 180 L368 192 L380 186 L386 194 L394 184 L404 190 L410 176" fill="#cfd6e8" />
      {[[338, 62], [384, 140], [244, 160]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="8" fill="#161b30" stroke="#ff9a2f" strokeWidth="3" />
      ))}
    </svg>
  )
}

export function TruckArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 430 270" role="img" aria-label="Тээврийн машин" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trk-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb13b" />
          <stop offset="1" stopColor="#f26200" />
        </linearGradient>
        <linearGradient id="trk-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe3ff" />
          <stop offset="1" stopColor="#3b6d9c" />
        </linearGradient>
      </defs>
      <ellipse cx="215" cy="252" rx="200" ry="9" fill="#000" opacity=".35" />
      {/* Хөрс ачсан ковш */}
      <path d="M118 108 L338 56 Q352 53 358 66 L388 176 H126 Z" fill="url(#trk-body)" />
      <path d="M128 110 L344 62 L352 90 L136 140 Z" fill="#fff" opacity=".12" />
      <path d="M152 100 L168 176 M196 90 L212 176 M240 79 L256 176 M284 68 L300 176 M328 60 L344 176" stroke="#b84800" strokeWidth="5" opacity=".5" />
      <path d="M126 112 L338 62 L352 80 L132 132 Z" fill="#2a2f45" opacity=".55" />
      <path d="M130 120 L338 70 L346 86 L134 138 Z" fill="#6b5a46" />
      <path d="M150 116 l12 -8 l10 6 l12 -9 l14 8 l12 -9 l12 8" fill="#7d6a52" />
      {/* Кабин */}
      <path d="M44 176 V120 Q44 104 60 104 H110 L124 136 V176 Z" fill="url(#trk-body)" />
      <path d="M56 114 H104 L114 138 H56 Z" fill="url(#trk-glass)" />
      <rect x="36" y="100" width="92" height="8" rx="4" fill="#d85300" />
      <rect x="30" y="150" width="14" height="26" rx="4" fill="#2a2f45" />
      <rect x="34" y="158" width="9" height="6" rx="3" fill="#ffe29a" />
      {/* Шасси */}
      <rect x="40" y="172" width="356" height="26" rx="8" fill="#1d2340" />
      {/* Дугуй */}
      {[110, 316].map((x) => (
        <g key={x}>
          <circle cx={x} cy="208" r="44" fill="#0c1020" />
          <circle cx={x} cy="208" r="37" fill="#171c33" stroke="#2f3862" strokeWidth="3" />
          <circle cx={x} cy="208" r="19" fill="#ff7a1a" />
          <circle cx={x} cy="208" r="9" fill="#1d2340" />
          <circle cx={x} cy="208" r="31" fill="none" stroke="#2a3254" strokeWidth="2" strokeDasharray="4 6" />
        </g>
      ))}
    </svg>
  )
}

/* Нэвтрэх дэлгэцийн гэгээтэй уурхайн дүр зураг */
export function MineScene({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Уурхайн дүр зураг" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070b1b" />
          <stop offset=".38" stopColor="#1a1c44" />
          <stop offset=".62" stopColor="#7b3a55" />
          <stop offset=".78" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#ffb865" />
        </linearGradient>
        <radialGradient id="ms-sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff2c8" stopOpacity=".95" />
          <stop offset=".35" stopColor="#ffb25a" stopOpacity=".5" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ms-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070b16" stopOpacity="0" />
          <stop offset="1" stopColor="#070b16" stopOpacity=".96" />
        </linearGradient>
        <linearGradient id="ms-rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a3e" />
          <stop offset="1" stopColor="#120f1e" />
        </linearGradient>
      </defs>
      <rect width="390" height="844" fill="url(#ms-sky)" />
      {[[40, 90], [120, 40], [210, 120], [300, 60], [350, 150], [70, 200], [250, 220], [180, 30]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#fff" opacity=".7" />
      ))}
      <g transform="translate(0 -120)">
        <circle cx="262" cy="520" r="190" fill="url(#ms-sun)" />
        <path d="M0 540 L70 470 L120 505 L190 430 L250 495 L310 450 L390 520 V1100 H0 Z" fill="#2a2347" opacity=".95" />
        <path d="M0 585 L60 530 L130 575 L210 505 L290 570 L350 535 L390 560 V1100 H0 Z" fill="#1b1634" />
        <path d="M0 640 L120 612 L200 650 L260 628 L390 668 V1100 H0 Z" fill="url(#ms-rock)" />
        <path d="M0 690 L90 668 L170 702 L250 676 L390 716 V1100 H0 Z" fill="#150f20" />
        <path d="M0 640 L120 612 L200 650 L260 628 L390 668" stroke="#ff9a4a" strokeWidth="2" fill="none" opacity=".55" />
        <path d="M0 690 L90 668 L170 702 L250 676 L390 716" stroke="#ff9a4a" strokeWidth="1.5" fill="none" opacity=".35" />
        <g transform="translate(-10 468) scale(.6)">
          <ExcavatorShape />
        </g>
        <g transform="translate(206 574) scale(.44)">
          <TruckShape />
        </g>
      </g>
      <rect y="470" width="390" height="374" fill="url(#ms-fade)" />
    </svg>
  )
}

/* MineScene дотор дахин ашиглах хэлбэрүүд (өөр gradient id-тай) */
function ExcavatorShape() {
  return (
    <g>
      <rect x="36" y="206" width="262" height="58" rx="29" fill="#0b0f20" />
      <rect x="44" y="214" width="246" height="42" rx="21" fill="none" stroke="#2f3a62" strokeWidth="3" strokeDasharray="7 5" />
      <rect x="86" y="190" width="172" height="22" rx="6" fill="#1c2340" />
      <rect x="50" y="118" width="124" height="66" rx="15" fill="#ff7a14" />
      <path d="M170 184 V98 Q170 88 180 88 H228 Q237 88 241 97 L256 150 V184 Z" fill="#ff8a1f" />
      <path d="M180 99 H224 L240 142 H180 Z" fill="#5d86ad" />
      <path d="M244 160 Q292 100 338 62" stroke="#ff7a14" strokeWidth="21" strokeLinecap="round" fill="none" />
      <path d="M338 62 L384 140" stroke="#ff7a14" strokeWidth="15" strokeLinecap="round" fill="none" />
      <path d="M366 138 L404 120 Q420 150 410 176 Q394 190 372 180 Z" fill="#2a3150" stroke="#ff9a2f" strokeWidth="2" />
      <path d="M262 132 L304 84 M312 58 L360 84" stroke="#c9d1e6" strokeWidth="7" strokeLinecap="round" />
    </g>
  )
}

function TruckShape() {
  return (
    <g>
      <path d="M118 108 L338 56 Q352 53 358 66 L388 176 H126 Z" fill="#ff7a14" />
      <path d="M130 120 L338 70 L346 86 L134 138 Z" fill="#5d4b3a" />
      <path d="M44 176 V120 Q44 104 60 104 H110 L124 136 V176 Z" fill="#ff8a1f" />
      <path d="M56 114 H104 L114 138 H56 Z" fill="#5d86ad" />
      <rect x="40" y="172" width="356" height="26" rx="8" fill="#1a2040" />
      {[110, 316].map((x) => (
        <g key={x}>
          <circle cx={x} cy="208" r="44" fill="#0a0d1b" />
          <circle cx={x} cy="208" r="19" fill="#ff7a1a" />
        </g>
      ))}
    </g>
  )
}

/* ---------- Жижиг график ба бусад дүрслэл ---------- */

export function Ring({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3be08a" />
            <stop offset="1" stopColor="#19b86a" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1d2a45" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(c * clamped) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: 'drop-shadow(0 0 6px #19b86a88)', transition: 'stroke-dasharray .9s ease' }}
        />
      </svg>
      <span>
        <strong>{Math.round(clamped)}%</strong>
        {label && <small>{label}</small>}
      </span>
    </div>
  )
}

export function Spark({ values, labels }: { values: number[]; labels?: string[] }) {
  const w = 240
  const h = 96
  const pad = 10
  const max = Math.max(1, ...values)
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0
  const pts = values.map((v, i) => [pad + i * step, h - 22 - (v / max) * (h - 40)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h - 22} L${pts[0][0].toFixed(1)} ${h - 22} Z`
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Сүүлийн өдрүүдийн хөдөлгөөн">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7a1a" stopOpacity=".45" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke="#ff8a2a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.2" fill="#ffb066" stroke="#ff7a1a" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      ))}
      {labels?.map((label, i) => (
        <text key={i} x={pts[i][0]} y={h - 6} textAnchor="middle" fontSize="10" fill="#7f8ea8">{label}</text>
      ))}
    </svg>
  )
}

export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 800)
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{shown}</>
}

const categoryIcons: Record<string, LucideIcon> = {
  'Гар багаж': Hammer,
  'Цахилгаан багаж': Zap,
  'Өрөмдлөг': Wrench,
  'Гагнуур': Flame,
  'Хэмжих хэрэгсэл': Ruler,
  'Насос': Droplets,
}

export function CategoryIcon({ category, size = 20 }: { category: string; size?: number }) {
  const Icon = categoryIcons[category] ?? Package
  return <Icon size={size} />
}
