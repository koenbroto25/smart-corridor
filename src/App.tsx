import React, { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { supabase } from "./lib/supabaseClient";
import type { Space } from "./lib/types";
import Auth from "./components/Auth";
import SpacesList from "./components/SpacesList";
import BoardCanvas from "./components/BoardCanvas";
import Toolbar from "./components/Toolbar";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [space, setSpace] = useState<Space | null>(null);
  const [role, setRole] = useState<string>("viewer");
  const [showAuth, setShowAuth] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<{ spaceId: string; code: string } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("space");
    const code = params.get("invite");
    if (sid && code) setPendingInvite({ spaceId: sid, code });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) setShowAuth(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !pendingInvite) return;
    (async () => {
      await supabase.rpc("join_space_by_invite", {
        p_space_id: pendingInvite.spaceId,
        p_invite_code: pendingInvite.code,
      });
      const { data } = await supabase.from("spaces").select("*").eq("id", pendingInvite.spaceId).single();
      if (data) {
        setSpace(data as Space);
        const { data: m } = await supabase
          .from("space_members")
          .select("role")
          .eq("space_id", pendingInvite.spaceId)
          .eq("user_id", session.user.id)
          .single();
        setRole(m?.role ?? "editor");
      }
      setPendingInvite(null);
    })();
  }, [session, pendingInvite]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (space) {
    const canEdit = !!session && (role === "owner" || role === "editor");
    return (
      <div className="flex h-screen flex-col">
        <div className="flex items-center justify-between bg-white p-2 shadow">
          <button className="rounded bg-gray-200 px-3 py-1" onClick={() => setSpace(null)}>
            Back
          </button>
          <span className="font-semibold">{space.name}</span>
          <div className="flex gap-2">
            <InviteButton space={space} canEdit={canEdit} />
            <ShareButton setOpen={setShareOpen} />
          </div>
          <span className="text-sm text-gray-500">{role}</span>
        </div>
        <div className="relative flex flex-1">
          <div className="relative flex-1">
            <BoardCanvas spaceId={space.id} canEdit={canEdit} role={role} />
            {canEdit && <Toolbar spaceId={space.id} canEdit={canEdit} />}
          </div>
        </div>
        {shareOpen && (
          <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
            <ShareModal space={space} onClose={() => setShareOpen(false)} />
          </div>
        )}
      </div>
    );
  }

  if (showAuth && !session) {
    return (
      <div>
        <button className="m-2 rounded bg-gray-200 px-3 py-1" onClick={() => setShowAuth(false)}>
          Back
        </button>
        <Auth />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80')" }}
    >
      <div className="min-h-screen bg-black/40">
        <div className="flex justify-end p-2">
          {session ? (
            <button className="rounded bg-gray-200 px-3 py-1" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          ) : (
            <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={() => setShowAuth(true)}>
              Sign in
            </button>
          )}
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex items-center gap-4 rounded-xl bg-white/90 p-4 shadow">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white">
              SC
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">smart-corridor-playground</h1>
              <p className="text-sm text-gray-600">SMP Negeri 26 Balikpapan — Collaborative Playground</p>
            </div>
          </div>
          {showAuth ? (
            <div className="rounded-xl bg-white/95 p-4 shadow">
              <button className="mb-2 rounded bg-gray-200 px-3 py-1" onClick={() => setShowAuth(false)}>
                Back
              </button>
              <Auth />
            </div>
          ) : (
            <div className="rounded-xl bg-white/95 p-4 shadow">
              <SpacesList
                userId={session?.user?.id}
                onOpen={(s, r) => {
                  setSpace(s);
                  setRole(r);
                }}
                onSignIn={() => setShowAuth(true)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InviteButton({ space, canEdit }: { space: Space; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(space.invite_code ?? "");
  const [link, setLink] = useState("");

  const generate = async () => {
    const c = Math.random().toString(36).slice(2, 10);
    await supabase.from("spaces").update({ invite_code: c }).eq("id", space.id);
    setCode(c);
    setLink(`${window.location.origin}?space=${space.id}&invite=${c}`);
  };

  useEffect(() => {
    if (code) setLink(`${window.location.origin}?space=${space.id}&invite=${code}`);
  }, [code, space.id]);

  if (!canEdit) return null;

  return (
    <>
      <button className="rounded bg-indigo-600 px-3 py-1 text-white" onClick={() => setOpen(true)}>
        Invite
      </button>
      {open && (
        <div className="absolute right-2 top-12 z-50 w-80 rounded bg-white p-3 shadow">
          <div className="mb-2 flex justify-between">
            <span className="font-semibold">Invite collaborators</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          {!code && (
            <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={generate}>
              Generate invite link
            </button>
          )}
          {code && (
            <>
              <div className="text-xs text-gray-600">Invite code: {code}</div>
              <input className="mt-2 w-full rounded border px-2 py-1 text-xs" value={link} readOnly />
              <button
                className="mt-2 rounded bg-gray-200 px-3 py-1 text-xs"
                onClick={() => navigator.clipboard.writeText(link)}
              >
                Copy link
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function ShareButton({ setOpen }: { setOpen: (v: boolean) => void }) {
  return (
    <button className="rounded bg-purple-600 px-3 py-1 text-white" onClick={() => setOpen(true)}>
      Share Playground
    </button>
  );
}

function ShareModal({ space, onClose }: { space: Space; onClose: () => void }) {
  const [isPublic, setIsPublic] = useState(space.is_public);
  const [coverColor, setCoverColor] = useState(space.cover_color ?? "#fef08a");
  const [coverImage, setCoverImage] = useState(space.cover_image ?? "");
  const [cardTitle, setCardTitle] = useState(space.name);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase
      .from("spaces")
      .update({
        is_public: isPublic,
        cover_color: coverColor,
        cover_image: coverImage || null,
        name: cardTitle,
      })
      .eq("id", space.id);
    setSaving(false);
    onClose();
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `covers/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (error) {
      alert(error.message);
      return;
    }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    setCoverImage(data.publicUrl);
  };

  const exportPDF = async () => {
    const el = document.getElementById("board-canvas");
    if (!el) return;
    setSaving(true);
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${space.name}.pdf`);
    setSaving(false);
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Share Playground</h2>
        <button className="rounded bg-gray-200 px-3 py-1" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            id="public-toggle"
            type="checkbox"
            className="rounded bg-gray-100 border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <label className="text-sm font-medium text-gray-700" htmlFor="public-toggle">
            Make public (visible on homepage)
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Card title</label>
          <input
            className="w-full rounded border px-2 py-1"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Card cover color</label>
          <input
            type="color"
            className="h-8 w-12 rounded border-none cursor-pointer"
            value={coverColor}
            onChange={(e) => setCoverColor(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Card cover image</label>
          <input
            type="file"
            accept="image/*"
            className="w-full rounded border px-2 py-1"
            onChange={uploadCover}
          />
          {coverImage && (
            <img src={coverImage} alt="cover" className="mt-2 rounded h-32 w-full object-cover" />
          )}
        </div>

        <div className="rounded-lg border p-3 flex items-center gap-3 text-sm">
          <div className="rounded h-12 w-12" style={{ backgroundColor: coverColor }}></div>
          <span className="font-medium truncate">{cardTitle}</span>
          <span className="ml-auto text-xs text-gray-500">{isPublic ? "Public" : "Private"}</span>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            className="rounded bg-gray-200 px-4 py-2 text-gray-800 disabled:opacity-50"
            onClick={onClose}
            disabled={saving}
          >
            Close
          </button>
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
            onClick={exportPDF}
            disabled={saving}
          >
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}