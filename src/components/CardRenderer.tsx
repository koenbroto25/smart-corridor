import { useState } from "react";
import type { Item } from "../lib/types";

interface Props {
  item: Item;
  canEdit: boolean;
  selected?: boolean;
  onUpdate?: (id: string, content: Record<string, any>) => void;
}

export default function CardRenderer({ item, canEdit, selected, onUpdate }: Props) {
  const c = item.content || {};
  const [play, setPlay] = useState(false);

  if (item.type === "note" && c.shape?.startsWith("arrow")) {
    const dir = c.shape.replace("arrow-", "");
    return (
      <div className="flex h-full w-full items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {dir === "right" && <polygon points="10,40 70,40 70,20 90,50 70,80 70,60 10,60" fill={c.color ?? "#2563eb"} />}
          {dir === "left" && <polygon points="90,40 30,40 30,20 10,50 30,80 30,60 90,60" fill={c.color ?? "#2563eb"} />}
          {dir === "up" && <polygon points="40,90 40,30 20,30 50,10 80,30 60,30 60,90" fill={c.color ?? "#2563eb"} />}
          {dir === "down" && <polygon points="40,10 40,70 20,70 50,90 80,70 60,70 60,10" fill={c.color ?? "#2563eb"} />}
          {dir === "double" && <polygon points="10,45 40,45 40,25 60,50 40,75 40,55 10,55 10,45 60,45 90,45 60,25 60,45 90,45 90,55 60,55 60,75 40,50" fill={c.color ?? "#2563eb"} />}
        </svg>
      </div>
    );
  }

  if (item.type === "note") {
    const shape = c.shape ?? "note";
    const font = c.font ?? "Inter";
    const size = c.size ?? 14;
    const bold = c.bold ?? false;
    const italic = c.italic ?? false;
    const align = c.align ?? "left";
    const color = c.color ?? "#fef08a";
    const textColor = c.textColor ?? "#111827";
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(c.text ?? "");
    return (
      <div className="relative h-full w-full" style={{ fontFamily: font }}>
        {canEdit && selected && (
          <div className="absolute -top-10 left-0 z-50 flex items-center gap-1 rounded bg-white p-1 shadow">
            <select
              value={font}
              onChange={(e) => onUpdate?.(item.id, { ...c, font: e.target.value })}
              className="text-xs"
            >
              {["Inter","Roboto","Poppins","Montserrat","Playfair Display","Pacifico","Lobster","Caveat","Indie Flower","Fira Code"].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <input
              type="number"
              value={size}
              onChange={(e) => onUpdate?.(item.id, { ...c, size: Number(e.target.value) })}
              className="w-12 text-xs"
            />
            <button
              onClick={() => onUpdate?.(item.id, { ...c, bold: !bold })}
              className={`px-1 text-xs ${bold ? "bg-gray-300" : ""}`}
            >
              B
            </button>
            <button
              onClick={() => onUpdate?.(item.id, { ...c, italic: !italic })}
              className={`px-1 text-xs ${italic ? "bg-gray-300" : ""}`}
            >
              I
            </button>
            <select
              value={align}
              onChange={(e) => onUpdate?.(item.id, { ...c, align: e.target.value })}
              className="text-xs"
            >
              <option value="left">L</option>
              <option value="center">C</option>
              <option value="right">R</option>
            </select>
            <input
              type="color"
              value={textColor}
              onChange={(e) => onUpdate?.(item.id, { ...c, textColor: e.target.value })}
              className="h-6 w-6"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => onUpdate?.(item.id, { ...c, color: e.target.value })}
              className="h-6 w-6"
            />
          </div>
        )}
        <div
          className="h-full w-full p-3 shadow"
          style={{
            backgroundColor: color,
            borderRadius: shape === "circle" ? "50%" : "0.5rem",
            textAlign: align as any,
          }}
          onDoubleClick={() => canEdit && setEditing(true)}
        >
          {canEdit && editing ? (
            <textarea
              className="h-full w-full resize-none bg-transparent outline-none"
              style={{ fontSize: size, fontWeight: bold ? "bold" : "normal", fontStyle: italic ? "italic" : "normal", color: textColor }}
              value={text}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              onBlur={() => {
                setEditing(false);
                onUpdate?.(item.id, { ...c, text });
              }}
            />
          ) : (
            <div
              className="whitespace-pre-wrap"
              style={{ fontSize: size, fontWeight: bold ? "bold" : "normal", fontStyle: italic ? "italic" : "normal", color: textColor }}
            >
              {c.text || "Double-click to edit"}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (item.type === "image") {
    return (
      <div className="h-full w-full overflow-hidden rounded-lg bg-white shadow">
        {c.url ? (
          <img src={c.url} alt={c.title ?? ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No image</div>
        )}
      </div>
    );
  }

  if (item.type === "video") {
    if (play && (c.embedUrl || c.url)) {
      const src = c.embedUrl || c.url;
      return (
        <div className="h-full w-full overflow-hidden rounded-lg bg-black shadow">
          <iframe src={src} className="h-full w-full" allow="autoplay; fullscreen" title={c.title ?? "video"} />
        </div>
      );
    }
    return (
      <div className="relative h-full w-full overflow-hidden rounded-lg bg-black shadow">
        {c.image ? (
          <img src={c.image} alt={c.title ?? ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-white">Video</div>
        )}
        <button
          onClick={() => setPlay(true)}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-bold">▶ Play</span>
        </button>
        {c.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-xs text-white">{c.title}</div>
        )}
      </div>
    );
  }

  if (item.type === "drawing") {
    const pts = c.points || [];
    const d = pts.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return (
      <svg className="h-full w-full">
        <path d={d} fill="none" stroke={c.color ?? "#111827"} strokeWidth={c.width ?? 3} strokeDasharray={c.dash === "none" ? undefined : c.dash} opacity={c.opacity ?? 1} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <a
      href={c.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow"
    >
      {c.image && (
        <img src={c.image} alt={c.title ?? ""} className="h-24 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col gap-1 p-2">
        <div className="line-clamp-2 text-sm font-semibold text-gray-900">
          {c.title || c.url || "Link"}
        </div>
        {c.description && (
          <div className="line-clamp-2 text-xs text-gray-600">{c.description}</div>
        )}
        <div className="mt-auto text-xs text-gray-400">{item.type}</div>
      </div>
    </a>
  );
}
