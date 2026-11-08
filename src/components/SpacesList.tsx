import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Space } from "../lib/types";

interface Props {
  userId?: string;
  onOpen: (space: Space, role: string) => void;
  onSignIn?: () => void;
}

export default function SpacesList({ userId, onOpen, onSignIn }: Props) {
  const [spaces, setSpaces] = useState<{ space: Space; role: string }[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const map = new Map<string, { space: Space; role: string }>();
    const { data: pub } = await supabase.from("spaces").select("*").eq("is_public", true);
    (pub || []).forEach((s: Space) => map.set(s.id, { space: s, role: "viewer" }));
    if (userId) {
      const { data } = await supabase
        .from("space_members")
        .select("role, spaces(*)")
        .eq("user_id", userId);
      (data || []).forEach((d: any) => {
        map.set(d.spaces.id, { space: d.spaces as Space, role: d.role });
      });
    }
    setSpaces(Array.from(map.values()));
  };

  useEffect(() => {
    load();
  }, [userId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !name.trim()) return;
    const { data } = await supabase
      .from("spaces")
      .insert({ name: name.trim(), owner_id: userId })
      .select()
      .single();
    if (data) {
      setName("");
      await load();
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Spaces</h1>
        {!userId && onSignIn && (
          <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={onSignIn}>
            Sign in
          </button>
        )}
        {userId && (
          <button className="rounded bg-gray-200 px-3 py-1" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        )}
      </div>
      {userId && (
        <form onSubmit={create} className="mb-4 flex gap-2">
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="New space name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="rounded bg-blue-600 px-4 py-2 text-white">Create</button>
        </form>
      )}
      {!userId && (
        <p className="mb-4 text-sm text-gray-600">
          Viewing public spaces. Sign in to create or edit.
        </p>
      )}
      <ul className="space-y-2">
        {spaces.map(({ space, role }) => (
          <li key={space.id} className="flex items-center justify-between rounded border p-3">
            <span>
              {space.name} <span className="text-xs text-gray-500">({role})</span>
              {space.is_public && <span className="ml-2 text-xs text-green-600">public</span>}
            </span>
            <div className="flex gap-2">
              {userId === space.owner_id && (
                <>
                  <button
                    className="rounded bg-gray-200 px-2 py-1 text-xs"
                    onClick={async () => {
                      const n = prompt("New name", space.name);
                      if (!n) return;
                      await supabase.from("spaces").update({ name: n }).eq("id", space.id);
                      await load();
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                    onClick={async () => {
                      if (!confirm("Delete space?")) return;
                      await supabase.from("spaces").delete().eq("id", space.id);
                      await load();
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
              <button
                className="rounded bg-gray-800 px-3 py-1 text-white"
                onClick={() => onOpen(space, role)}
              >
                Open
              </button>
            </div>
          </li>
        ))}
        {spaces.length === 0 && <li className="text-gray-500">No spaces yet.</li>}
      </ul>
    </div>
  );
}