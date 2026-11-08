import React, { useEffect, useRef, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { supabase } from "../lib/supabaseClient";
import type { Item } from "../lib/types";
import CardRenderer from "./CardRenderer";
import LeftSidebar from "./LeftSidebar";

function DraggableCard({
  item,
  canEdit,
  scale,
  offset,
  selected,
  onSelect,
  onUpdate,
  onDelete,
}: {
  item: Item;
  canEdit: boolean;
  scale: number;
  offset: { x: number; y: number };
  selected?: boolean;
  onSelect?: () => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !canEdit,
  });
  const resizing = React.useRef(false);
  const resizeStart = React.useRef({ x: 0, y: 0, w: item.width, h: item.height });
  const style: React.CSSProperties = {
    position: "absolute",
    left: item.x * scale + offset.x,
    top: item.y * scale + offset.y,
    width: item.width * scale,
    height: item.height * scale,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 999 : item.z_index,
    touchAction: "none",
    outline: selected ? "2px solid #2563eb" : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect?.()}
    >
      <CardRenderer item={item} canEdit={canEdit} selected={selected} onUpdate={(id, content) => onUpdate(id, { content })} />
      {canEdit && selected && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            resizing.current = true;
            resizeStart.current = { x: e.clientX, y: e.clientY, w: item.width, h: item.height };
            const move = (ev: PointerEvent) => {
              if (!resizing.current) return;
              const dx = (ev.clientX - resizeStart.current.x) / scale;
              const dy = (ev.clientY - resizeStart.current.y) / scale;
              onUpdate(item.id, {
                width: Math.max(80, resizeStart.current.w + dx),
                height: Math.max(60, resizeStart.current.h + dy),
              });
            };
            const up = () => {
              resizing.current = false;
              document.removeEventListener("pointermove", move);
              document.removeEventListener("pointerup", up);
            };
            document.addEventListener("pointermove", move);
            document.addEventListener("pointerup", up);
          }}
          style={{
            position: "absolute",
            right: -6,
            bottom: -6,
            width: 12,
            height: 12,
            background: "#2563eb",
            cursor: "se-resize",
            borderRadius: 2,
          }}
        />
      )}
      {canEdit && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute right-1 top-1 rounded bg-red-600 px-1 text-xs text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default function BoardCanvas({ spaceId, canEdit }: { spaceId: string; canEdit: boolean; role?: string }) {
  const [activeTool, setActiveTool] = useState("select");
  const [defaultFont, setDefaultFont] = useState("Inter");
  const [defaultColor, setDefaultColor] = useState("#fef08a");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState("pen");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [eraserSize, setEraserSize] = useState(20);
  const [crayonStyle, setCrayonStyle] = useState("solid");
  const [items, setItems] = useState<Item[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const panning = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("items").select("*").eq("space_id", spaceId);
      if (mounted && data) setItems(data as Item[]);
    })();

    const channel = supabase
      .channel(`space:${spaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `space_id=eq.${spaceId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => (prev.some((i) => i.id === (payload.new as Item).id) ? prev : [...prev, payload.new as Item]));
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) => prev.map((i) => (i.id === (payload.new as Item).id ? (payload.new as Item) : i)));
          } else if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id));
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [spaceId]);

  const persistUpdate = async (id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    await supabase.from("items").update(patch).eq("id", id);
  };

  const persistDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("items").delete().eq("id", id);
  };

  const createFromTool = async (tool: string, x: number, y: number) => {
    if (tool === "sticky" || tool === "note" || tool === "text") {
      await createItem(spaceId, "note", x, y, { text: "", color: defaultColor, font: defaultFont, shape: tool === "sticky" ? "sticky" : "note" });
    } else if (tool === "shape") {
      await createItem(spaceId, "note", x, y, { text: "", color: defaultColor, font: defaultFont, shape: "rect" });
    } else if (tool === "frame") {
      await createItem(spaceId, "note", x, y, { text: "Frame", color: "#e5e7eb", font: defaultFont, width: 400, height: 300 });
    } else if (["link", "image", "video", "article", "game"].includes(tool)) {
      const url = prompt(`Enter ${tool} URL`);
      if (!url) return;
      await createItem(spaceId, tool === "image" ? "image" : tool === "video" ? "video" : tool === "article" ? "article" : tool === "game" ? "game" : "link", x, y, { url });
    }
    setActiveTool("select");
  };
  const handleAction = async (action: string) => {
    const center = { x: (window.innerWidth / 2 - offset.x) / scale, y: (window.innerHeight / 2 - offset.y) / scale };
    switch (action) {
      case "zoom-in":
        setScale((s) => Math.min(3, s * 1.1));
        break;
      case "draw-pen":
        setDrawMode("pen");
        break;
      case "draw-marker":
        setDrawMode("marker");
        break;
      case "draw-crayon":
        setDrawMode("crayon");
        break;
      case "draw-eraser":
        setDrawMode("eraser");
        break;
      case "reset-view":
        setScale(1);
        setOffset({ x: 0, y: 0 });
        break;
      case "delete":
        if (selectedId) {
          await persistDelete(selectedId);
          setSelectedId(null);
        }
        break;
      case "duplicate":
        if (selectedId) {
          const it = items.find((i) => i.id === selectedId);
          if (it) {
            await createItem(spaceId, it.type, it.x + 20, it.y + 20, { ...it.content });
          }
        }
        break;
      case "front":
        if (selectedId) {
          const maxZ = Math.max(...items.map((i) => i.z_index), 0);
          await persistUpdate(selectedId, { z_index: maxZ + 1 });
        }
        break;
      case "back":
        if (selectedId) {
          await persistUpdate(selectedId, { z_index: 0 });
        }
        break;
      case "sticky-yellow":
        await createItem(spaceId, "note", center.x, center.y, { text: "", color: "#fef08a", font: defaultFont, shape: "sticky" });
        break;
      case "sticky-blue":
        await createItem(spaceId, "note", center.x, center.y, { text: "", color: "#bfdbfe", font: defaultFont, shape: "sticky" });
        break;
      case "sticky-green":
        await createItem(spaceId, "note", center.x, center.y, { text: "", color: "#bbf7d0", font: defaultFont, shape: "sticky" });
        break;
      case "sticky-pink":
        await createItem(spaceId, "note", center.x, center.y, { text: "", color: "#fbcfe8", font: defaultFont, shape: "sticky" });
        break;
      case "note-plain":
        await createItem(spaceId, "note", center.x, center.y, { text: "", color: defaultColor, font: defaultFont });
        break;
      case "note-rich":
        await createItem(spaceId, "note", center.x, center.y, { text: "Rich note", color: defaultColor, font: defaultFont });
        break;
      case "text-heading":
        await createItem(spaceId, "note", center.x, center.y, { text: "Heading", color: "#ffffff", font: defaultFont });
        break;
      case "text-body":
        await createItem(spaceId, "note", center.x, center.y, { text: "Body text", color: "#ffffff", font: defaultFont });
        break;
      case "shape-rect":
        await createItem(spaceId, "note", center.x, center.y, { text: "", color: defaultColor, font: defaultFont, shape: "rect" });
        break;
      case "shape-circle":
        await createItem(spaceId, "note", center.x, center.y, { text: "", color: defaultColor, font: defaultFont, shape: "circle" });
        break;
      case "shape-triangle":
        await createItem(spaceId, "note", center.x, center.y, { text: "", color: defaultColor, font: defaultFont, shape: "triangle" });
        break;
      case "shape-arrow-right":
      case "shape-arrow-left":
      case "shape-arrow-up":
      case "shape-arrow-down":
      case "shape-arrow-double": {
        const shape = action.replace("shape-", "");
        await createItem(spaceId, "note", center.x, center.y, { text: "", color: defaultColor, font: defaultFont, shape });
        break;
      }
      case "frame-small":
        await createItem(spaceId, "note", center.x, center.y, { text: "Frame", color: "#e5e7eb", font: defaultFont, shape: "frame", width: 300, height: 200 });
        break;
      case "frame-large":
        await createItem(spaceId, "note", center.x, center.y, { text: "Frame", color: "#e5e7eb", font: defaultFont, shape: "frame", width: 500, height: 350 });
        break;
      case "link-paste":
      case "image-url":
      case "video-youtube":
      case "video-vimeo": {
        const url = prompt("Enter URL");
        if (!url) break;
        const type = action.startsWith("image") ? "image" : action.startsWith("video") ? "video" : "link";
        await createItem(spaceId, type, center.x, center.y, { url });
        break;
      }
      case "link-open":
        if (selectedId) {
          const it = items.find((i) => i.id === selectedId);
          if (it?.content?.url) window.open(it.content.url, "_blank");
        }
        break;
      case "image-upload": {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          const path = `images/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage.from("images").upload(path, file);
          if (error) return;
          const { data } = supabase.storage.from("images").getPublicUrl(path);
          await createItem(spaceId, "image", center.x, center.y, { url: data.publicUrl });
        };
        input.click();
        break;
      }
      default:
        if (action.startsWith("sticker:")) {
          const emoji = action.replace("sticker:", "");
          await createItem(spaceId, "note", center.x, center.y, { text: emoji, color: "#ffffff", font: defaultFont, size: 48 });
        }
        break;
    }
  };
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, delta } = e;
    const item = items.find((i) => i.id === active.id);
    if (!item) return;
    const nx = item.x + delta.x / scale;
    const ny = item.y + delta.y / scale;
    persistUpdate(item.id, { x: nx, y: ny });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.min(3, Math.max(0.3, s * factor)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    if (activeTool === "draw" && canEdit) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      if (drawMode === "eraser") {
        const cx = (e.clientX - rect.left - offset.x) / scale;
        const cy = (e.clientY - rect.top - offset.y) / scale;
        items.forEach((it) => {
          if (it.type === "drawing" && it.content?.points) {
            const hit = it.content.points.some((p: any) => Math.hypot(p.x - cx, p.y - cy) < eraserSize / scale);
            if (hit) persistDelete(it.id);
          }
        });
        return;
      }
      const pt = { x: (e.clientX - rect.left - offset.x) / scale, y: (e.clientY - rect.top - offset.y) / scale };
      const pts: { x: number; y: number }[] = [pt];
      const move = (ev: PointerEvent) => {
        const p = { x: (ev.clientX - rect.left - offset.x) / scale, y: (ev.clientY - rect.top - offset.y) / scale };
        pts.push(p);
      };
      const up = async () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        if (pts.length > 1) {
          await createItem(spaceId, "drawing", 0, 0, {
            points: pts,
            color: defaultColor,
            width: strokeWidth,
            mode: drawMode,
            dash: crayonStyle === "dashed" ? "8,4" : crayonStyle === "dotted" ? "2,6" : crayonStyle === "zigzag" ? "4,2,1,2" : "none",
            opacity: drawMode === "marker" ? 0.5 : 1,
          });
        }
        setActiveTool("select");
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
      return;
    }
    if (activeTool && activeTool !== "select" && activeTool !== "pan" && canEdit) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = (e.clientX - rect.left - offset.x) / scale;
      const cy = (e.clientY - rect.top - offset.y) / scale;
      createFromTool(activeTool, cx, cy);
      return;
    }
    panning.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!panning.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };
  const onPointerUp = () => {
    panning.current = false;
  };

  return (
    <div className="flex h-full w-full">
      {canEdit && (
        <LeftSidebar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          defaultFont={defaultFont}
          onFontChange={setDefaultFont}
          defaultColor={defaultColor}
          onColorChange={setDefaultColor}
          onAction={handleAction}
          drawMode={drawMode}
          onDrawModeChange={setDrawMode}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          eraserSize={eraserSize}
          onEraserSizeChange={setEraserSize}
          crayonStyle={crayonStyle}
          onCrayonStyleChange={setCrayonStyle}
        />
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          className="relative flex-1 overflow-visible bg-gray-100"
          style={{ cursor: activeTool === "draw" ? (drawMode === "eraser" ? "cell" : "crosshair") : activeTool === "pan" ? "grab" : "default" }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {items.map((item) => (
            <DraggableCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              scale={scale}
              offset={offset}
              selected={selectedId === item.id}
              onSelect={() => setSelectedId(item.id)}
              onUpdate={persistUpdate}
              onDelete={persistDelete}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

export async function createItem(spaceId: string, type: string, x: number, y: number, content: Record<string, any>) {
  const { data } = await supabase
    .from("items")
    .insert({ space_id: spaceId, type, x, y, content })
    .select()
    .single();
  return data;
}
