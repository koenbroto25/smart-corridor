export interface TemplateItem {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: Record<string, any>;
}

export interface Template {
  name: string;
  description: string;
  preview: string;
  items: TemplateItem[];
}

export const templates: Template[] = [
  {
    name: "Brainstorm Pro",
    description: "Central idea with colorful branches and stickers",
    preview: "💡",
    items: [
      { type: "note", x: 360, y: 220, content: { text: "Main Idea", color: "#fde68a", font: "Poppins", size: 18, bold: true } },
      { type: "note", x: 120, y: 80, content: { text: "Idea A", color: "#bfdbfe", font: "Inter" } },
      { type: "note", x: 600, y: 80, content: { text: "Idea B", color: "#bbf7d0", font: "Inter" } },
      { type: "note", x: 120, y: 360, content: { text: "Idea C", color: "#fbcfe8", font: "Inter" } },
      { type: "note", x: 600, y: 360, content: { text: "Idea D", color: "#fde68a", font: "Inter" } },
      { type: "note", x: 360, y: 80, content: { text: "🚀", color: "#ffffff", size: 32 } },
      { type: "image", x: 200, y: 500, content: { url: "https://picsum.photos/seed/brain/240/160", title: "Inspiration" } },
    ],
  },
  {
    name: "Kanban Flow",
    description: "To Do / Doing / Done with tasks and links",
    preview: "📋",
    items: [
      { type: "note", x: 80, y: 60, content: { text: "To Do", color: "#fca5a5", bold: true } },
      { type: "note", x: 320, y: 60, content: { text: "Doing", color: "#fde68a", bold: true } },
      { type: "note", x: 560, y: 60, content: { text: "Done", color: "#86efac", bold: true } },
      { type: "note", x: 80, y: 180, content: { text: "Task A", color: "#e5e7eb" } },
      { type: "note", x: 320, y: 180, content: { text: "Task B", color: "#e5e7eb" } },
      { type: "note", x: 560, y: 180, content: { text: "Task C", color: "#e5e7eb" } },
      { type: "link", x: 80, y: 320, content: { url: "https://example.com", title: "Project Docs", description: "Reference documentation", image: "https://picsum.photos/seed/docs/240/120" } },
    ],
  },
  {
    name: "Mind Map",
    description: "Central topic with branches and images",
    preview: "🧠",
    items: [
      { type: "note", x: 360, y: 220, content: { text: "Topic", color: "#fde68a", font: "Montserrat", size: 20, bold: true } },
      { type: "note", x: 160, y: 100, content: { text: "Branch 1", color: "#bfdbfe" } },
      { type: "note", x: 560, y: 100, content: { text: "Branch 2", color: "#bfdbfe" } },
      { type: "note", x: 160, y: 340, content: { text: "Branch 3", color: "#bbf7d0" } },
      { type: "note", x: 560, y: 340, content: { text: "Branch 4", color: "#bbf7d0" } },
      { type: "image", x: 360, y: 420, content: { url: "https://picsum.photos/seed/mind/200/120", title: "Visual" } },
    ],
  },
  {
    name: "Retrospective",
    description: "Went well / To improve / Actions with stickers",
    preview: "🔄",
    items: [
      { type: "note", x: 80, y: 60, content: { text: "What went well", color: "#86efac", bold: true } },
      { type: "note", x: 320, y: 60, content: { text: "To improve", color: "#fca5a5", bold: true } },
      { type: "note", x: 560, y: 60, content: { text: "Action items", color: "#93c5fd", bold: true } },
      { type: "note", x: 80, y: 180, content: { text: "Great teamwork 👏", color: "#dcfce7" } },
      { type: "note", x: 320, y: 180, content: { text: "More testing needed", color: "#fee2e2" } },
      { type: "note", x: 560, y: 180, content: { text: "Add CI pipeline", color: "#dbeafe" } },
    ],
  },
  {
    name: "SWOT Analysis",
    description: "Strengths, Weaknesses, Opportunities, Threats",
    preview: "📊",
    items: [
      { type: "note", x: 80, y: 60, content: { text: "Strengths", color: "#86efac", bold: true } },
      { type: "note", x: 320, y: 60, content: { text: "Weaknesses", color: "#fca5a5", bold: true } },
      { type: "note", x: 80, y: 260, content: { text: "Opportunities", color: "#93c5fd", bold: true } },
      { type: "note", x: 320, y: 260, content: { text: "Threats", color: "#fde68a", bold: true } },
      { type: "link", x: 560, y: 120, content: { url: "https://example.com/swot", title: "SWOT Guide", image: "https://picsum.photos/seed/swot/200/120" } },
    ],
  },
  {
    name: "Flowchart",
    description: "Start, process, decision, end with arrows",
    preview: "🔀",
    items: [
      { type: "note", x: 360, y: 40, content: { text: "Start", color: "#86efac", shape: "circle" } },
      { type: "note", x: 360, y: 160, content: { text: "Process", color: "#93c5fd" } },
      { type: "note", x: 360, y: 280, content: { text: "Decision?", color: "#fde68a", shape: "circle" } },
      { type: "note", x: 160, y: 400, content: { text: "End (Yes)", color: "#86efac" } },
      { type: "note", x: 560, y: 400, content: { text: "End (No)", color: "#fca5a5" } },
      { type: "note", x: 360, y: 340, content: { text: "⬇", color: "#ffffff", size: 24 } },
    ],
  },
  {
    name: "Mood Board",
    description: "Images, colors, and inspiration links",
    preview: "🎨",
    items: [
      { type: "image", x: 80, y: 60, content: { url: "https://picsum.photos/seed/mood1/200/160", title: "Inspo 1" } },
      { type: "image", x: 300, y: 60, content: { url: "https://picsum.photos/seed/mood2/200/160", title: "Inspo 2" } },
      { type: "image", x: 520, y: 60, content: { url: "https://picsum.photos/seed/mood3/200/160", title: "Inspo 3" } },
      { type: "note", x: 80, y: 260, content: { text: "Palette", color: "#fbcfe8" } },
      { type: "link", x: 300, y: 260, content: { url: "https://example.com/design", title: "Design Ref", image: "https://picsum.photos/seed/ref/200/120" } },
    ],
  },
  {
    name: "Meeting Agenda",
    description: "Agenda items, notes, and action owners",
    preview: "📅",
    items: [
      { type: "note", x: 80, y: 60, content: { text: "Agenda", color: "#93c5fd", bold: true } },
      { type: "note", x: 80, y: 180, content: { text: "1. Updates", color: "#e5e7eb" } },
      { type: "note", x: 80, y: 300, content: { text: "2. Decisions", color: "#e5e7eb" } },
      { type: "note", x: 80, y: 420, content: { text: "3. Actions", color: "#e5e7eb" } },
      { type: "note", x: 320, y: 180, content: { text: "Owner: Alex", color: "#fef08a" } },
    ],
  },
  {
    name: "User Journey",
    description: "Stages with emotions and touchpoints",
    preview: "🗺️",
    items: [
      { type: "note", x: 80, y: 60, content: { text: "Awareness", color: "#bfdbfe", bold: true } },
      { type: "note", x: 260, y: 60, content: { text: "Consideration", color: "#bbf7d0", bold: true } },
      { type: "note", x: 440, y: 60, content: { text: "Purchase", color: "#fde68a", bold: true } },
      { type: "note", x: 620, y: 60, content: { text: "Retention", color: "#fbcfe8", bold: true } },
      { type: "note", x: 80, y: 180, content: { text: "😊", color: "#ffffff", size: 28 } },
      { type: "note", x: 260, y: 180, content: { text: "🤔", color: "#ffffff", size: 28 } },
      { type: "link", x: 440, y: 180, content: { url: "https://example.com/buy", title: "Buy Page", image: "https://picsum.photos/seed/buy/160/100" } },
    ],
  },
  {
    name: "Kanban + Stickers",
    description: "Playful kanban with emoji stickers",
    preview: "🎯",
    items: [
      { type: "note", x: 80, y: 60, content: { text: "Backlog", color: "#e5e7eb", bold: true } },
      { type: "note", x: 300, y: 60, content: { text: "In Progress", color: "#fde68a", bold: true } },
      { type: "note", x: 520, y: 60, content: { text: "Done", color: "#86efac", bold: true } },
      { type: "note", x: 80, y: 180, content: { text: "Design UI", color: "#bfdbfe" } },
      { type: "note", x: 300, y: 180, content: { text: "Build API", color: "#bfdbfe" } },
      { type: "note", x: 520, y: 180, content: { text: "Deploy", color: "#bbf7d0" } },
      { type: "note", x: 80, y: 300, content: { text: "🔥", color: "#ffffff", size: 32 } },
      { type: "note", x: 300, y: 300, content: { text: "⚡", color: "#ffffff", size: 32 } },
    ],
  },
];