import React, { useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { detectContentType } from "../lib/detectContentType";
import { createItem } from "./BoardCanvas";
import { templates } from "../lib/templates";

interface Props {
  spaceId: string;
  canEdit: boolean;
}

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return null;
}
function vimeoEmbed(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

export default function Toolbar({ spaceId, canEdit }: Props) {
  const [input, setInput] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<(typeof templates)[number] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addItem = async (type: string, content: Record<string, any>, x?: number, y?: number) => {
    await createItem(spaceId, type, x ?? Math.random() * 400 + 50, y ?? Math.random() * 300 + 50, content);
  };

  const applyTemplate = async (t: (typeof templates)[number]) => {
    for (const it of t.items) {
      await addItem(it.type, it.content, it.x, it.y);
    }
    setShowTemplates(false);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const trimmed = input.trim();
    const type = detectContentType(trimmed);
    if (type === "note") {
      await addItem("note", { text: trimmed, color: "#fef08a" });
      setInput("");
      return;
    }
    let content: Record<string, any> = { url: trimmed };
    if (type === "image") {
      content = { url: trimmed };
    } else if (type === "video") {
      try {
        const { data } = await supabase.functions.invoke("fetch-link-preview", { body: { url: trimmed } });
        content = { url: trimmed, title: data?.title, image: data?.image, embedUrl: data?.embedUrl };
      } catch {
        const embed = youtubeEmbed(trimmed) || vimeoEmbed(trimmed);
        content = { url: trimmed, embedUrl: embed };
      }
    } else {
      try {
        const { data } = await supabase.functions.invoke("fetch-link-preview", { body: { url: trimmed } });
        content = { url: trimmed, title: data?.title, description: data?.description, image: data?.image };
      } catch {
        content = { url: trimmed };
      }
    }
    await addItem(type, content);
    setInput("");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `images/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (error) {
      alert(error.message);
      return;
    }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    await addItem("image", { url: data.publicUrl });
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!canEdit) return null;

  return (
    <>
      <div className="absolute left-2 top-2 z-50 flex items-center gap-2 rounded-lg bg-white p-2 shadow">
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            className="w-64 rounded border px-2 py-1 text-sm"
            placeholder="Type note or paste URL"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
            Add
          </button>
        </form>
        <button
          className="rounded bg-purple-600 px-3 py-1 text-sm text-white"
          onClick={() => setShowTemplates(true)}
        >
          Templates
        </button>
        <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} className="text-sm" />
      </div>
      {showTemplates && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-lg bg-white p-4 shadow">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Choose template</h2>
              <button onClick={() => setShowTemplates(false)}>✕</button>
            </div>
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.name} className="flex items-center justify-between rounded border p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{t.preview}</span>
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.description}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded bg-gray-200 px-2 py-1 text-xs"
                      onClick={() => setPreviewTemplate(t)}
                    >
                      Preview
                    </button>
                    <button
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
                      onClick={() => applyTemplate(t)}
                    >
                      Apply
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {previewTemplate && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[480px] rounded-lg bg-white p-4 shadow">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{previewTemplate.name}</h2>
              <button onClick={() => setPreviewTemplate(null)}>✕</button>
            </div>
            <div className="relative h-[300px] w-full overflow-hidden rounded bg-gray-100">
              {previewTemplate.items.map((it, idx) => (
                <div
                  key={idx}
                  className="absolute flex items-center justify-center rounded p-1 text-xs shadow"
                  style={{
                    left: it.x * 0.6,
                    top: it.y * 0.6,
                    width: (it.width ?? 120) * 0.6,
                    height: (it.height ?? 80) * 0.6,
                    backgroundColor: it.content.color ?? "#e5e7eb",
                    fontFamily: it.content.font ?? "Inter",
                    fontSize: (it.content.size ?? 12) * 0.6,
                  }}
                >
                  {it.type === "image" ? "🖼️" : it.content.text || it.type}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded bg-gray-200 px-3 py-1" onClick={() => setPreviewTemplate(null)}>
                Close
              </button>
              <button
                className="rounded bg-blue-600 px-3 py-1 text-white"
                onClick={() => {
                  applyTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}