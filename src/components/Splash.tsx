import { useState } from 'react'
import { motion } from 'motion/react'
import { HardHat } from 'lucide-react'
import { MineScene } from './Art'

export default function Splash({ onEnter }: { onEnter: () => void }) {
  const [note, setNote] = useState(false)
  return (
    <div className="splash">
      <MineScene className="splash-scene" />
      <motion.div className="splash-top" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
        <div className="splash-logo"><HardHat size={38} strokeWidth={1.8} /></div>
        <h1>Уурхайн<br />Багаж</h1>
        <p>Багажаа үр ашигтай удирдаарай</p>
      </motion.div>
      <motion.div className="splash-actions" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}>
        <button className="button primary big" onClick={onEnter}>Нэвтрэх</button>
        <button className="button outline big" onClick={() => setNote(true)}>Бүртгүүлэх</button>
        {note && <p className="splash-note" role="status">Шинэ бүртгэл нээх нь уурхайн өгөгдлийн сантай холбогдсоны дараа боломжтой болно. Одоо «Нэвтрэх»-ээр демо хувилбарыг үзнэ үү.</p>}
        <small>Демо хувилбар · өгөгдөл зөвхөн энэ төхөөрөмжид хадгалагдана</small>
      </motion.div>
    </div>
  )
}
