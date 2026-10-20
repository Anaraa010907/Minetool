import { useEffect, useRef, useState } from "react";

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
      <form onSubmit={submit} className="row">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder={placeholder}
          inputMode="text"
          autoComplete="off"
        />
        <button type="submit" className="btn">OK</button>
        {supported && (
          <button
            type="button"
            className="btn gold"
            onClick={() => (cameraOn ? stop() : (setError(""), setCameraOn(true)))}
          >
            {cameraOn ? "Хаах" : "📷 Скан"}
          </button>
        )}
      </form>
      {!supported && (
        <p className="hint">Энэ хөтөч камераар уншихыг дэмжихгүй. Гараар бичих эсвэл USB скэнэр ашиглана уу.</p>
      )}
      {error && <p className="error">{error}</p>}
      {cameraOn && <video ref={videoRef} className="video" playsInline muted />}
    </div>
  );
}
