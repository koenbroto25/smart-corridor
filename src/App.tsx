import { useEffect, useState } from "react";
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
          <InviteButton space={space} canEdit={canEdit} />
          <span className="text-sm text-gray-500">{role}</span>
        </div>
        <div className="relative flex flex-1">
          <div className="relative flex-1">
            <BoardCanvas spaceId={space.id} canEdit={canEdit} role={role} />
            {canEdit && <Toolbar spaceId={space.id} canEdit={canEdit} />}
          </div>
        </div>
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
    <div>
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
      <SpacesList
        userId={session?.user?.id}
        onOpen={(s, r) => {
          setSpace(s);
          setRole(r);
        }}
        onSignIn={() => setShowAuth(true)}
      />
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