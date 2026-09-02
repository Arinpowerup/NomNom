import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cropImage } from "./lib/images";

type Props = {
  file: File;
  language: "zh" | "en";
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void> | void;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function ImageCropper({ file, language, onCancel, onConfirm }: Props) {
  const [preview, setPreview] = useState("");
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number; positionX: number; positionY: number } | undefined>(undefined);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, positionX: position.x, positionY: position.y };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPosition({
      x: clamp(drag.current.positionX - ((event.clientX - drag.current.x) / Math.max(1, bounds.width)) * 100 / zoom),
      y: clamp(drag.current.positionY - ((event.clientY - drag.current.y) / Math.max(1, bounds.height)) * 100 / zoom),
    });
  };
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = undefined;
  };
  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(await cropImage(file, { positionX: position.x, positionY: position.y, zoom })); }
    finally { setBusy(false); }
  };

  return <div className="overlay crop-overlay" role="presentation">
    <section className="modal image-cropper" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <div className="section-head"><div><p className="eyebrow">{language === "zh" ? "调整食记照片" : "Adjust food log photo"}</p><h2 id="crop-title">{language === "zh" ? "裁剪照片" : "Crop photo"}</h2></div></div>
      <p className="crop-help">{language === "zh" ? "拖拽照片调整位置，使用滑杆放大。" : "Drag to reposition the photo and use the slider to zoom."}</p>
      <div className="crop-viewport" aria-label={language === "zh" ? "照片裁剪区域" : "Photo crop area"} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
        {preview && <img src={preview} alt="" draggable={false} style={{ objectPosition: `${position.x}% ${position.y}%`, transform: `scale(${zoom})`, transformOrigin: `${position.x}% ${position.y}%` }} />}
        <span className="crop-grid" aria-hidden="true" />
      </div>
      <label className="crop-zoom"><span>{language === "zh" ? "缩放" : "Zoom"}</span><input aria-label={language === "zh" ? "照片缩放" : "Photo zoom"} type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
      <div className="modal-actions"><button className="soft" disabled={busy} onClick={onCancel}>{language === "zh" ? "取消" : "Cancel"}</button><button disabled={busy} onClick={() => void confirm()}>{busy ? (language === "zh" ? "处理中…" : "Processing…") : (language === "zh" ? "使用照片" : "Use photo")}</button></div>
    </section>
  </div>;
}