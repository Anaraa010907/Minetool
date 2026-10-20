import { useEffect, useRef, useState } from "react";
import Icon from "./Icons.jsx";

const FORMATS = ["code_128", "code_39", "ean_13", "ean_8", "itf", "codabar", "upc_a", "qr_code"];

// Камераар barcode уншина (BarcodeDetector дэмждэг хөтөч: Chrome Android гэх мэт).
// Дэмжихгүй бол гараар бичих / USB скэнэр (Enter дарна) ашиглана.
export default function BarcodeScanner({ onScan, placeholder = "Barcode / ID бичих" }) {
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => stop, []);

  useEffect(() => {
    if (!cameraOn) return;
    let cancelled = false;
    let timer;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new window.BarcodeDetector({ formats: FORMATS });
        const tick = async () => {
          if (cancelled) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length) {
              const value = codes[0].rawValue;
              stop();
              onScan(value);
              return;
            }
          } catch {
            /* дараагийн фрэймээр дахин оролдоно */
          }
          timer = setTimeout(tick, 250);
        };
        tick();
      } catch (e) {
        setError("Камер нээж чадсангүй. Зөвшөөрөл өгсөн эсэхээ шалгана уу.");
        setCameraOn(false);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cameraOn]);

  const submit = (e) => {
    e.preventDefault();
    const v = manual.trim();
    if (!v) return;
    onScan(v);
    setManual("");
  };

  return (
    <div className="scanner">
      <form onSubmit={submit} className="scan-row">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder={placeholder}
          inputMode="text"
          autoComplete="off"
          aria-label={placeholder}
        />
        {supported && (
          <button
            type="button"
            className={"btn " + (cameraOn ? "primary" : "accent")}
            onClick={() => (cameraOn ? stop() : (setError(""), setCameraOn(true)))}
          >
            <Icon name={cameraOn ? "x" : "scan"} size={20} />
            {cameraOn ? "Хаах" : "Скан"}
          </button>
        )}
        <button type="submit" className="btn primary" aria-label="Оруулах">
          <Icon name="check" size={20} />
        </button>
      </form>
      {!supported && (
        <p className="msg" style={{ color: "var(--muted)" }}>
          Камераар унших боломжгүй хөтөч байна. Кодоо бичих эсвэл USB скэнэр ашиглана уу.
        </p>
      )}
      {error && <p className="msg error">{error}</p>}
      {cameraOn && (
        <div className="camera">
          <video ref={videoRef} playsInline muted />
        </div>
      )}
    </div>
  );
}
