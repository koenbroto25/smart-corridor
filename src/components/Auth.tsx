import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e?.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold">
        {mode === "signin" ? "Sign in" : "Register"}
      </h1>
      <div className="mb-4 flex gap-2">
        <button
          className={`rounded px-3 py-1 ${mode === "signin" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          className={`rounded px-3 py-1 ${mode === "register" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          className="w-full rounded border px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          className="w-full rounded border px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Register"}
        </button>
        {err && <p className="text-red-600">{err}</p>}
      </form>
    </div>
  );
}