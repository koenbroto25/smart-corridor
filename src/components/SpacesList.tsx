import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Space } from "../lib/types";

interface Props {
  userId?: string;
  onOpen: (space: Space, role: string) => void;
  onSignIn?: () => void;
}

export default function SpacesList({ userId, onOpen, onSignIn }: Props) {
  const [publicSpaces, setPublicSpaces] = useState<Space[]>([]);
  const [mySpaces, setMySpaces] = useState<{ space: Space; role: string }[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const { data: pub } = await supabase.from("spaces").select("*").eq("is_public", true);
    setPublicSpaces((pub || []) as Space[]);

    const map = new Map<string, { space: Space; role: string }>();
    if (userId) {
      const { data } = await supabase.from("space_members").select("role, spaces(*)").eq("user_id", userId);
      (data || []).forEach((d: any) => map.set(d.spaces.id, { space: d.spaces as Space, role: d.role }));
    }
    setMySpaces(Array.from(map.values()));
  };

  useEffect(() => { load(); }, [userId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !name.trim()) return;
    const { data } = await supabase.from("spaces").insert({ name: name.trim(), owner_id: userId }).select().single();
    if (data) {
      setName("");
      await load();
    }
  };

  const cardStyle = (s: Space) => ({
    backgroundColor: s.cover_color ?? "#fef08a",
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Spaces</h1>
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

      {publicSpaces.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Public Playgrounds</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {publicSpaces.map((s) => (
              <div
                key={s.id}
                className="rounded-xl overflow-hidden shadow border cursor-pointer group"
                style={cardStyle(s)}
                onClick={() => onOpen(s, "viewer")}
              >
                <div className="h-32 w-full object-cover bg-gray-200">
                  {s.cover_image ? (
                    <img src={s.cover_image} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-gray-700 opacity-60 group-hover:opacity-100">
                      {s.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 truncate">{s.name}</h3>
                  <p className="text-xs text-gray-500">Public playground</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {userId && (
        <>
          <form onSubmit={create} className="mb-6 flex gap-2">
            <input
              className="flex-1 rounded border px-3 py-2"
              placeholder="New space name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="rounded bg-blue-600 px-4 py-2 text-white">Create</button>
          </form>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">My Spaces</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mySpaces.map(({ space, role }) => (
              <div key={space.id} className="rounded-xl overflow-hidden shadow border">
                <div className="h-32 w-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 opacity-70">
                  {space.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 truncate">{space.name}</h3>
                  <p className="text-xs text-gray-500">{role}</p>
                </div>
                <div className="p-2 border-t flex justify-end gap-2">
                  <button
                    className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                    onClick={() => onOpen(space, role)}
                  >
                    Open
                  </button>
                  {role === "owner" && (
                    <button
                      className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                      onClick={async () => {
                        if (!confirm("Hapus space ini? Data akan hilang permanen.")) return;
                        await supabase.from("spaces").delete().eq("id", space.id);
                        await load();
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
            {mySpaces.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No spaces yet. Create your first space.
              </div>
            )}
          </div>
        </>
      )}
      {!userId && publicSpaces.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p>No public playgrounds yet.</p>
          <p className="text-sm">Sign in to create your own space.</p>
        </div>
      )}
    </div>
  );
}