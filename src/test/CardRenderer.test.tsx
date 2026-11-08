import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CardRenderer from "../components/CardRenderer";
import type { Item } from "../lib/types";

const base: Item = {
  id: "1",
  space_id: "s",
  type: "note",
  x: 0,
  y: 0,
  width: 240,
  height: 160,
  z_index: 0,
  content: {},
};

describe("CardRenderer", () => {
  it("renders note text", () => {
    render(<CardRenderer item={{ ...base, type: "note", content: { text: "hi note" } }} canEdit={false} />);
    expect(screen.getByText("hi note")).toBeInTheDocument();
  });
  it("renders link title", () => {
    render(<CardRenderer item={{ ...base, type: "link", content: { url: "https://x.com", title: "My Link" } }} canEdit={false} />);
    expect(screen.getByText("My Link")).toBeInTheDocument();
  });
  it("renders image", () => {
    render(<CardRenderer item={{ ...base, type: "image", content: { url: "https://x.com/img.png" } }} canEdit={false} />);
    expect(document.querySelector("img")).toBeInTheDocument();
  });
});