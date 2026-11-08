import { describe, it, expect } from "vitest";
import detectContentType from "../lib/detectContentType";

describe("detectContentType", () => {
  it("returns note for plain text", () => {
    expect(detectContentType("hello world")).toBe("note");
  });
  it("detects image urls", () => {
    expect(detectContentType("https://example.com/pic.png")).toBe("image");
  });
  it("detects video urls", () => {
    expect(detectContentType("https://www.youtube.com/watch?v=abc")).toBe("video");
  });
  it("detects game urls", () => {
    expect(detectContentType("https://itch.io/games/foo")).toBe("game");
  });
  it("defaults to link", () => {
    expect(detectContentType("https://example.com/article")).toBe("link");
  });
});