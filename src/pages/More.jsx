import { useState } from "react";
import Icon from "../components/Icons.jsx";
import { PageTitle } from "../components/Bits.jsx";
import History from "./History.jsx";
import Repairs from "./Repairs.jsx";
import Workers from "./Workers.jsx";

const ITEMS = [
  { id: "history", icon: "report", title: "Түүх ба тайлан", sub: "Олголт, буцаалтын түүх, CSV экспорт" },
  { id: "repairs", icon: "wrench", title: "Засвар, үйлчилгээ", sub: "Засварт байгаа багаж, засварын түүх" },
  { id: "workers", icon: "users", title: "Ажилчид", sub: "Ажилтан, үнэмлэхний barcode" },
];

export default function More(props) {
  const [view, setView] = useState(null);
  const back = () => setView(null);

  if (view === "history") return <History {...props} onBack={back} />;
  if (view === "repairs") return <Repairs {...props} onBack={back} />;
  if (view === "workers") return <Workers {...props} onBack={back} />;

  return (
    <>
      <PageTitle eyebrow="Уурхайн агуулах" title="Бусад" sub="Тайлан, засвар, ажилчдын бүртгэл" />
      <section className="card">
        {ITEMS.map((i) => (
          <button key={i.id} className="menu-item" onClick={() => setView(i.id)}>
            <span className="menu-ico"><Icon name={i.icon} size={22} /></span>
            <span className="grow">
              <b>{i.title}</b>
              <span className="sub">{i.sub}</span>
            </span>
            <span className="chev"><Icon name="right" size={18} /></span>
          </button>
        ))}
      </section>
    </>
  );
}
