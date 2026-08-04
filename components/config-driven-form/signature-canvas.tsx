"use client";

import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type SignatureCanvasProps = {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  compressWidth?: number;
  compressQuality?: number;
  error?: string;
};

function compressCanvas(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  quality: number
): string {
  const ratio = Math.min(1, maxWidth / canvas.width);
  const targetWidth = Math.round(canvas.width * ratio);
  const targetHeight = Math.round(canvas.height * ratio);

  const offscreen = document.createElement("canvas");
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;

  const ctx = offscreen.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", quality / 100);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  return offscreen.toDataURL("image/jpeg", quality / 100);
}

export function SignatureCanvas({
  label,
  value,
  onChange,
  compressWidth = 600,
  compressQuality = 70,
  error,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const emitCompressed = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(compressCanvas(canvas, compressWidth, compressQuality));
  }, [compressQuality, compressWidth, onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
    }
  }, [value]);

  function getPoint(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    const point = getPoint(e);
    ctx?.beginPath();
    ctx?.moveTo(point.x, point.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const point = getPoint(e);
    ctx?.lineTo(point.x, point.y);
    ctx?.stroke();
  }

  function endDraw() {
    if (!drawing.current) return;
    drawing.current = false;
    emitCompressed();
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={`rounded-md border bg-white ${error ? "border-destructive" : "border-input"}`}
      >
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          Clear
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
