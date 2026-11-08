import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../lib/supabaseClient";
import type { Item } from "../lib/types";

interface Props {
  item: Item;
  canEdit: boolean;
  selected?: boolean;
  activeTool?: string;
  drawMode?: string;
  strokeWidth?: number;
  defaultColor?: string;
  crayonStyle?: string;
  onUpdate?: (id: string, content: Record<string, any>) => void;
  onCardDrawStart?: () => void;
  onCardDrawMove?: (x: number, y: number) => void;
  onCardDrawEnd?: () => void;
}

export default function CardRenderer({ item, canEdit, selected, activeTool, drawMode, strokeWidth, defaultColor, crayonStyle, onUpdate, onCardDrawStart, onCardDrawMove, onCardDrawEnd }: Props) {
  const c = item.content || {};
  const [play, setPlay] = useState(false);
  const [showInsert, setShowInsert] = useState(false);
  const [linkPreview, setLinkPreview] = useState<Record<string, any> | null>(c.linkPreview || null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [editing, setEditing] = useState(false);

  const [editFont, setEditFont] = useState(c.font ?? "Inter");
  const [editSize, setEditSize] = useState(c.size ?? 14);
  const [editBold, setEditBold] = useState(c.bold ?? false);
  const [editItalic, setEditItalic] = useState(c.italic ?? false);
  const [editAlign, setEditAlign] = useState(c.align ?? "left");
  const [editTextColor, setEditTextColor] = useState(c.textColor ?? "#111827");
  const [editBgColor, setEditBgColor] = useState(c.bgColor ?? c.color ?? "#fef08a");
  const [editThumbnail, setEditThumbnail] = useState(c.thumbnail ?? "");
  const [editHideLinkText, setEditHideLinkText] = useState(c.hideLinkText ?? false);

  const shape = c.shape ?? "note";
  const font = c.font ?? editFont;
  const size = c.size ?? editSize;
  const bold = c.bold ?? editBold;
  const italic = c.italic ?? editItalic;
  const align = c.align ?? editAlign;
  const color = c.color ?? editBgColor;
  const textColor = c.textColor ?? editTextColor;
  const bgColor = c.bgColor ?? editBgColor;

  useEffect(() => {
    if (c.linkUrl && (!c.linkPreview || c.linkPreview.url !== c.linkUrl)) {
      (async () => {
        try {
          const { data } = await supabase.functions.invoke("fetch-link-preview", { body: { url: c.linkUrl } });
          if (data && !data.error) {
            const preview = { title: data.title, description: data.description, image: data.image, siteName: data.siteName, url: data.url };
            setLinkPreview(preview);
            onUpdate?.(item.id, { ...c, linkUrl: data.url, linkPreview: preview });
          }
        } catch { }
      })();
    } else if (c.linkPreview) {
      setLinkPreview(c.linkPreview);
    }
  }, [c.linkUrl, c.linkPreview, item.id, onUpdate]);

  const insertLink = async (url: string) => {
    try {
      const { data } = await supabase.functions.invoke("fetch-link-preview", { body: { url } });
      if (data && !data.error) {
        const preview = { title: data.title, description: data.description, image: data.image, siteName: data.siteName, url: data.url };
        setLinkPreview(preview);
        onUpdate?.(item.id, { ...c, linkUrl: data.url, linkPreview: preview });
      }
    } catch { }
  };

  const insertImage = async (url: string) => {
    const preview = { title: "", description: "", image: url, siteName: "", url };
    setLinkPreview(preview);
    onUpdate?.(item.id, { ...c, linkUrl: url, linkPreview: preview });
  };

  const insertFrame = async (url: string) => {
    const isVideo = /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
    const frame = { type: isVideo ? "video" : "image", url, title: isVideo ? "Video" : "Gambar", x: 0, y: 0, w: 200, h: 150 };
    onUpdate?.(item.id, { ...c, frames: [...(c.frames ?? []), frame] });
  };

  const saveSettings = async () => {
    await onUpdate?.(item.id, {
      ...c,
      font: editFont, size: editSize, bold: editBold, italic: editItalic, align: editAlign,
      color: editBgColor, textColor: editTextColor, bgColor: editBgColor,
      thumbnail: editThumbnail, hideLinkText: editHideLinkText,
    });
    setSettingsOpen(false);
  };

  if (item.type === "note" && c.shape?.startsWith("arrow")) {
    const dir = c.shape.replace("arrow-", "");
    return (
      <div className="flex h-full w-full items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {dir === "right" && <polygon points="10,40 70,40 70,20 90,50 70,80 70,60 10,60" fill={color ?? "#2563eb"} />}
          {dir === "left" && <polygon points="90,40 30,40 30,20 10,50 30,80 30,60 90,60" fill={color ?? "#2563eb"} />}
          {dir === "up" && <polygon points="40,90 40,30 20,30 50,10 80,30 60,30 60,90" fill={color ?? "#2563eb"} />}
          {dir === "down" && <polygon points="40,10 40,70 20,70 50,90 80,70 60,10" fill={color ?? "#2563eb"} />}
          {dir === "double" && <polygon points="10,45 40,45 40,25 60,50 40,75 40,55 10,55 10,45 60,45 90,45 60,25 60,45 90,45 90,55 60,55 60,75 40,50" fill={color ?? "#2563eb"} />}
        </svg>
      </div>
    );
  }

  if (item.type === "note") {
    return (
      <div className="relative h-full w-full" style={{ fontFamily: font }}>
        {canEdit && selected && (
          <div className="absolute -top-10 left-0 z-[9998] flex items-center gap-1 rounded bg-white p-1 shadow overflow-visible">
            <select value={editFont} onChange={(e) => setEditFont(e.target.value)} className="text-xs">
              {["Inter","Roboto","Poppins","Montserrat","Playfair Display","Pacifico","Lobster","Caveat","Indie Flower","Fira Code"].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <input type="number" value={editSize} onChange={(e) => setEditSize(Number(e.target.value))} className="w-12 text-xs" />
            <button onClick={() => setEditBold(!editBold)} className={`px-1 text-xs ${bold ? "bg-gray-300" : ""}`}>B</button>
            <button onClick={() => setEditItalic(!editItalic)} className={`px-1 text-xs ${italic ? "bg-gray-300" : ""}`}>I</button>
            <select value={editAlign} onChange={(e) => setEditAlign(e.target.value)} className="text-xs">
              <option value="left">L</option><option value="center">C</option><option value="right">R</option>
            </select>
            <input type="color" value={editTextColor} onChange={(e) => setEditTextColor(e.target.value)} className="h-6 w-6" />
            <input type="color" value={editBgColor} onChange={(e) => setEditBgColor(e.target.value)} className="h-6 w-6" />
            <div className="relative">
              <button onClick={() => setShowInsert((v) => !v)} className="rounded bg-gray-200 px-2 py-1 text-xs">Insert</button>
              {showInsert && (
                <div className="absolute top-8 left-0 z-[9999] w-32 rounded bg-white p-1 shadow overflow-visible">
                  <button className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-gray-100" onClick={() => { const url = prompt("Masukkan URL link"); if (url) insertLink(url); setShowInsert(false); }}>Link</button>
                  <button className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-gray-100" onClick={() => { const url = prompt("Masukkan URL gambar"); if (url) insertImage(url); setShowInsert(false); }}>Gambar</button>
                  <button className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-gray-100" onClick={() => { const url = prompt("Masukkan URL video"); if (url) insertFrame(url); setShowInsert(false); }}>Frame Video</button>
                  <button className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-gray-100" onClick={() => { onUpdate?.(item.id, { ...c, drawings: [...(c.drawings ?? []), { points: [], color: defaultColor, width: strokeWidth, dash: crayonStyle === "dashed" ? "8,4" : crayonStyle === "dotted" ? "2,6" : crayonStyle === "zigzag" ? "4,2,1,2" : "none", opacity: drawMode === "marker" ? 0.5 : 1 }] }); setShowInsert(false); }}>Drawing</button>
                  <button className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-gray-100" onClick={() => { onUpdate?.(item.id, { ...c, text: (c.text ?? "") + " 😀" }); setShowInsert(false); }}>Sticker</button>
                </div>
              )}
              <button onClick={() => setSettingsOpen(true)} className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">⚙</button>
            </div>
          </div>
        )}
        <div className="relative h-full w-full p-3 shadow overflow-visible" style={{ backgroundColor: bgColor, borderRadius: shape === "circle" ? "50%" : "0.5rem", textAlign: align as any }} onDoubleClick={() => canEdit && setEditing(true)} onPointerDown={(e) => { if (activeTool === "draw" && canEdit && selected && onCardDrawStart) { e.stopPropagation(); onCardDrawStart(); const rect = e.currentTarget.getBoundingClientRect(); const startX = e.clientX - rect.left; const startY = e.clientY - rect.top; onCardDrawMove?.(startX, startY); const move = (ev: PointerEvent) => { const x = ev.clientX - rect.left; const y = ev.clientY - rect.top; onCardDrawMove?.(x, y); }; const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); onCardDrawEnd?.(); }; document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); } }}>
          {canEdit && editing ? (
            <textarea className="h-full w-full resize-none bg-transparent outline-none" style={{ fontSize: editSize, fontWeight: bold ? "bold" : "normal", fontStyle: italic ? "italic" : "normal", color: editTextColor }} value={c.text ?? ""} autoFocus onChange={(e) => { const v = e.target.value; onUpdate?.(item.id, { ...c, text: v }); }} onBlur={() => onUpdate?.(item.id, { ...c, text: c.text ?? "" })} />
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words" style={{ fontSize: size, fontWeight: bold ? "bold" : "normal", fontStyle: italic ? "italic" : "normal", color: textColor }}>{c.text || "Double-click to edit"}</div>
              {c.drawings && c.drawings.length > 0 && (
                <div className="relative w-full h-full overflow-hidden mt-2">
                  <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>{c.drawings.map((d: any, di: number) => { const pts = d.points || []; const dd = pts.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "); return <path key={di} d={dd} fill="none" stroke={d.color ?? "#111827"} strokeWidth={d.width ?? 3} strokeDasharray={d.dash === "none" ? undefined : d.dash} strokeLinecap="round" strokeLinejoin="round" opacity={d.opacity ?? 1} />; })}</svg>
                </div>
              )}
              {c.frames && c.frames.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">{c.frames.map((f: any, fi: number) => <div key={fi} className="relative rounded overflow-hidden shadow border">{f.type === "image" && f.url ? <img src={f.url} alt={f.title ?? ""} className="w-full h-48 object-cover" /> : <div className="flex h-48 items-center justify-center bg-gray-100 text-xs text-gray-500">{f.type}</div>}{f.title && <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-xs text-white">{f.title}</div>}</div>)}</div>
              )}
              {linkPreview && (
                <div className="mt-2 rounded border bg-white/90 p-2 shadow flex flex-col gap-1 cursor-pointer" onClick={() => window.open(linkPreview.url, "_blank")}>
                  {linkPreview.image && <img src={linkPreview.image} alt={linkPreview.title ?? ""} className="h-16 w-full object-cover rounded" />}
                  <div className="line-clamp-2 text-sm font-semibold text-gray-900">{linkPreview.title || linkPreview.url}</div>
                  {linkPreview.description && <div className="line-clamp-2 text-xs text-gray-600">{linkPreview.description}</div>}
                  <div className="mt-auto text-xs text-gray-400 truncate">{linkPreview.url}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (item.type === "image") {
    return (
      <div className="h-full w-full overflow-hidden rounded-lg bg-white shadow">{c.url ? <img src={c.url} alt={c.title ?? ""} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-400">No image</div>}</div>
    );
  }

  if (item.type === "video") {
    if (play && (c.embedUrl || c.url)) { const src = c.embedUrl || c.url; return <div className="h-full w-full overflow-hidden rounded-lg bg-black shadow"><iframe src={src} className="h-full w-full" allow="autoplay; fullscreen" title={c.title ?? "video"} /></div>; }
    return (
      <div className="relative h-full w-full overflow-hidden rounded-lg bg-black shadow">{c.image ? <img src={c.image} alt={c.title ?? ""} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white">Video</div>}<button onClick={() => setPlay(true)} className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-white/80 px-3 py-1 text-sm font-bold">▶ Play</span></button>{c.title && <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-xs text-white">{c.title}</div>}</div>
    );
  }

  if (item.type === "drawing") {
    const pts = c.points || [];
    const d = pts.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return <svg className="h-full w-full"><path d={d} fill="none" stroke={color ?? "#111827"} strokeWidth={c.width ?? 3} strokeDasharray={c.dash === "none" ? undefined : c.dash} opacity={c.opacity ?? 1} strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }

  // link / article / game card
  const shareUrl = `${window.location.origin}?space=${item.space_id}&item=${item.id}`;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow">
      {canEdit && selected && (
        <div className="absolute -top-10 left-0 z-[9998] flex items-center gap-1 rounded bg-white p-1 shadow overflow-visible">
          <button onClick={() => setSettingsOpen(true)} className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">⚙</button>
          <button onClick={() => setShowQR(true)} className="rounded bg-green-600 px-2 py-1 text-xs text-white">QR</button>
        </div>
      )}
      {showQR && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="rounded bg-white p-4 shadow text-center">
            <QRCodeSVG value={shareUrl} size={200} />
            <p className="mt-2 text-sm text-gray-600 truncate" title={shareUrl}>{shareUrl}</p>
            <button className="mt-2 rounded bg-gray-200 px-3 py-1 text-xs" onClick={() => setShowQR(false)}>Tutup</button>
          </div>
        </div>
      )}
      {!editHideLinkText && (
        <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex h-full w-full flex-col overflow-hidden">
          {c.image && <img src={c.image} alt={c.title ?? ""} className="h-24 w-full object-cover" />}
          <div className="flex flex-1 flex-col gap-1 p-2"><div className="line-clamp-2 text-sm font-semibold text-gray-900">{c.title || c.url || "Link"}</div>{c.description && <div className="line-clamp-2 text-xs text-gray-600">{c.description}</div>}<div className="mt-auto text-xs text-gray-400">{item.type}</div></div>
        </a>
      )}
      {editHideLinkText && c.thumbnail && (
        <div className="h-full w-full flex items-center justify-center bg-gray-50">
          <img src={c.thumbnail} alt={c.title ?? ""} className="max-h-[70%] max-w-[70%] rounded shadow" />
        </div>
      )}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="rounded bg-white p-6 shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Pengaturan Card</h3>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Font</label>
              <select value={editFont} onChange={(e) => setEditFont(e.target.value)} className="w-full rounded border px-2 py-1 text-sm">
                {["Inter","Roboto","Poppins","Montserrat","Playfair Display","Pacifico","Lobster","Caveat","Indie Flower","Fira Code"].map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <label className="text-sm font-medium text-gray-700">Ukuran teks</label>
              <input type="number" value={editSize} onChange={(e) => setEditSize(Number(e.target.value))} className="w-full rounded border px-2 py-1 text-sm" />
              <label className="text-sm font-medium text-gray-700">Warna latar</label>
              <input type="color" value={editBgColor} onChange={(e) => setEditBgColor(e.target.value)} className="h-8 w-full" />
              <label className="text-sm font-medium text-gray-700">Warna teks</label>
              <input type="color" value={editTextColor} onChange={(e) => setEditTextColor(e.target.value)} className="h-8 w-full" />
              <label className="text-sm font-medium text-gray-700">Thumbnail (untuk video/lagu)</label>
              <input type="text" value={editThumbnail} placeholder="URL gambar" onChange={(e) => setEditThumbnail(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" checked={editHideLinkText} onChange={(e) => setEditHideLinkText(e.target.checked)} />
                Sembunyikan teks link (tampilkan hanya thumbnail)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="rounded bg-gray-200 px-4 py-2 text-gray-800" onClick={() => setSettingsOpen(false)}>Batal</button>
              <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={saveSettings}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
