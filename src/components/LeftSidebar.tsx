import { useState } from "react";

const tools = [
  { id: "select", label: "Select", short: "Se" },
  { id: "pan", label: "Pan", short: "Pa" },
  { id: "draw", label: "Draw", short: "Dr" },
  { id: "sticky", label: "Sticky Note", short: "St" },
  { id: "note", label: "Note", short: "No" },
  { id: "text", label: "Text", short: "Tx" },
  { id: "shape", label: "Shape", short: "Sh" },
  { id: "frame", label: "Frame", short: "Fr" },
  { id: "stickers", label: "Stickers", short: "Sk" },
  { id: "link", label: "Link", short: "Li" },
  { id: "image", label: "Image", short: "Im" },
  { id: "video", label: "Video", short: "Vi" },
];

const fonts = ["Inter", "Roboto", "Poppins", "Montserrat", "Playfair Display", "Pacifico", "Lobster", "Caveat", "Indie Flower", "Fira Code"];

const emojis = ["😀","😂","😍","🤔","😎","🥳","👍","❤️","🔥","🎉","🚀","💡","✅","⭐","🎯","📌","🧠","💬","🎨","🏆"];

const submenus: Record<string, { label: string; action: string }[]> = {
  select: [
    { label: "Duplicate", action: "duplicate" },
    { label: "Delete", action: "delete" },
    { label: "Bring to front", action: "front" },
    { label: "Send to back", action: "back" },
  ],
  pan: [
    { label: "Zoom in", action: "zoom-in" },
    { label: "Zoom out", action: "zoom-out" },
    { label: "Reset view", action: "reset-view" },
  ],
  draw: [
    { label: "Pen", action: "draw-pen" },
    { label: "Marker", action: "draw-marker" },
    { label: "Crayon", action: "draw-crayon" },
    { label: "Eraser", action: "draw-eraser" },
  ],
  sticky: [
    { label: "Yellow", action: "sticky-yellow" },
    { label: "Blue", action: "sticky-blue" },
    { label: "Green", action: "sticky-green" },
    { label: "Pink", action: "sticky-pink" },
  ],
  note: [
    { label: "Plain note", action: "note-plain" },
    { label: "Rich note", action: "note-rich" },
  ],
  text: [
    { label: "Heading", action: "text-heading" },
    { label: "Body", action: "text-body" },
  ],
  shape: [
    { label: "Rectangle", action: "shape-rect" },
    { label: "Circle", action: "shape-circle" },
    { label: "Triangle", action: "shape-triangle" },
    { label: "Arrow right", action: "shape-arrow-right" },
    { label: "Arrow left", action: "shape-arrow-left" },
    { label: "Arrow up", action: "shape-arrow-up" },
    { label: "Arrow down", action: "shape-arrow-down" },
    { label: "Double arrow", action: "shape-arrow-double" },
  ],
  frame: [
    { label: "Small frame", action: "frame-small" },
    { label: "Large frame", action: "frame-large" },
  ],
  stickers: emojis.map((e) => ({ label: e, action: `sticker:${e}` })),
  link: [
    { label: "Paste link", action: "link-paste" },
  ],
  image: [
    { label: "Upload image", action: "image-upload" },
    { label: "Image URL", action: "image-url" },
  ],
  video: [
    { label: "YouTube URL", action: "video-youtube" },
    { label: "Vimeo URL", action: "video-vimeo" },
  ],
};

interface Props {
  activeTool: string;
  onToolChange: (t: string) => void;
  defaultFont: string;
  onFontChange: (f: string) => void;
  defaultColor: string;
  onColorChange: (c: string) => void;
  onAction: (action: string) => void;
  drawMode: string;
  onDrawModeChange: (m: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (n: number) => void;
  eraserSize: number;
  onEraserSizeChange: (n: number) => void;
  crayonStyle: string;
  onCrayonStyleChange: (s: string) => void;
}

export default function LeftSidebar({
  activeTool,
  onToolChange,
  defaultFont,
  onFontChange,
  defaultColor,
  onColorChange,
  onAction,
  drawMode,
  onDrawModeChange,
  strokeWidth,
  onStrokeWidthChange,
  eraserSize,
  onEraserSizeChange,
  crayonStyle,
  onCrayonStyleChange,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div
      className={`flex h-full flex-col border-r bg-white py-3 transition-all ${
        expanded ? "w-56" : "w-16"
      }`}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mx-2 mb-2 rounded bg-gray-200 px-2 py-1 text-xs"
      >
        {expanded ? "Collapse" : "Expand"}
      </button>
      <div className="flex flex-col gap-1 px-2">
        {tools.map((t) => (
          <div key={t.id}>
            <button
              onClick={() => onToolChange(t.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm ${
                activeTool === t.id ? "bg-blue-600 text-white" : "hover:bg-gray-100"
              }`}
            >
              <span className="w-6 text-xs font-bold">{t.short}</span>
              {expanded && <span>{t.label}</span>}
            </button>
            {expanded && activeTool === t.id && (
              <div className="ml-6 flex flex-col gap-1 py-1">
                {t.id === "stickers" ? (
                  <div className="grid grid-cols-5 gap-1">
                    {submenus[t.id]?.map((s) => (
                      <button
                        key={s.action}
                        onClick={() => onAction(s.action)}
                        className="rounded px-1 py-1 text-lg hover:bg-gray-100"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  submenus[t.id]?.map((s) => (
                    <button
                      key={s.action}
                      onClick={() => onAction(s.action)}
                      className="rounded px-2 py-1 text-left text-xs hover:bg-gray-100"
                    >
                      {s.label}
                    </button>
                  ))
                )}
                {t.id === "draw" && (
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="text-xs">Mode</label>
                    <select
                      value={drawMode}
                      onChange={(e) => onDrawModeChange(e.target.value)}
                      className="rounded border px-1 py-1 text-xs"
                    >
                      <option value="pen">Pen</option>
                      <option value="marker">Marker</option>
                      <option value="crayon">Crayon</option>
                      <option value="eraser">Eraser</option>
                    </select>
                    <label className="text-xs">Stroke width</label>
                    <select
                      value={strokeWidth}
                      onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                      className="rounded border px-1 py-1 text-xs"
                    >
                      {[2, 4, 6, 8, 12].map((n) => (
                        <option key={n} value={n}>
                          {n}px
                        </option>
                      ))}
                    </select>
                    {drawMode === "crayon" && (
                      <>
                        <label className="text-xs">Crayon style</label>
                        <select
                          value={crayonStyle}
                          onChange={(e) => onCrayonStyleChange(e.target.value)}
                          className="rounded border px-1 py-1 text-xs"
                        >
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                          <option value="dotted">Dotted</option>
                          <option value="zigzag">Zigzag</option>
                        </select>
                      </>
                    )}
                    {drawMode === "eraser" && (
                      <>
                        <label className="text-xs">Eraser size</label>
                        <select
                          value={eraserSize}
                          onChange={(e) => onEraserSizeChange(Number(e.target.value))}
                          className="rounded border px-1 py-1 text-xs"
                        >
                          {[10, 20, 40, 60].map((n) => (
                            <option key={n} value={n}>
                              {n}px
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {expanded && (
        <div className="mt-4 flex flex-col gap-2 px-2">
          <label className="text-xs font-semibold">Font</label>
          <select
            value={defaultFont}
            onChange={(e) => onFontChange(e.target.value)}
            className="rounded border px-1 py-1 text-xs"
          >
            {fonts.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <label className="text-xs font-semibold">Color</label>
          <input
            type="color"
            value={defaultColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-8 w-full"
          />
        </div>
      )}
    </div>
  );
}
