import { describe, it, expect } from "vitest";
import { supabase } from "../lib/supabaseClient";

describe("RLS", () => {
  it("anonymous cannot insert item", async () => {
    const { error } = await supabase
      .from("items")
      .insert({ space_id: "00000000-0000-0000-0000-000000000000", type: "note", content: {} });
    expect(error).toBeTruthy();
  });
});