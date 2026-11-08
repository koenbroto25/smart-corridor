export type ContentType = "note" | "link" | "image" | "video" | "article" | "game";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|$)/i;
const VIDEO_HOSTS = ["youtube.com", "youtu.be", "vimeo.com", "drive.google.com"];
const GAME_HOSTS = ["itch.io", "scratch.mit.edu", "poki.com", "kongregate", "newgrounds.com"];

export function detectContentType(input: string): ContentType {
  const trimmed = (input ?? "").trim();
  if (!/^https?:\/\//i.test(trimmed)) return "note";
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "note";
  }
  const path = url.pathname.toLowerCase();
  if (IMAGE_EXT.test(path)) return "image";
  const host = url.hostname.toLowerCase();
  if (VIDEO_HOSTS.some((h) => host.includes(h))) return "video";
  if (GAME_HOSTS.some((h) => host.includes(h))) return "game";
  return "link";
}

export default detectContentType;
