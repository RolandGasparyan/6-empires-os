'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { useAuth } from '@/store/auth';

export default function FounderLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const setToken = useAuth((s) => s.setToken);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const t = await login(email, password);
      await setToken(t);
      router.replace('/founder');
    } catch {
      setErr('Invalid credentials');
    } finally { setBusy(false); }
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-obsidian-radial">
      <form onSubmit={submit} className="glass glass-gold rounded-2xl p-8 w-full max-w-sm">
        <div className="h-10 w-10 rounded-lg bg-gold-liquid animate-gold-flow shadow-gold-glow mb-5 grid place-items-center font-display font-extrabold text-obsidian-950">6</div>
        <h1 className="font-display font-bold text-xl text-gold-liquid">Founder Access</h1>
        <p className="text-white/40 text-xs mt-1 mb-5">6-EMPIRE OS · Private Command</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Founder email"
          className="w-full mb-3 bg-obsidian-900/70 border border-gold-500/20 rounded-lg px-3 py-2.5 text-sm text-white/90 outline-none focus:border-gold-500/50" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password"
          className="w-full mb-4 bg-obsidian-900/70 border border-gold-500/20 rounded-lg px-3 py-2.5 text-sm text-white/90 outline-none focus:border-gold-500/50" />
        {err && <div className="text-empire-danger text-xs mb-3">{err}</div>}
        <button disabled={busy} className="w-full bg-gold-liquid animate-gold-flow text-obsidian-950 font-semibold text-sm py-2.5 rounded-lg shadow-gold-glow disabled:opacity-50">
          {busy ? 'Authenticating…' : 'Enter Command Center'}
        </button>
      </form>
    </div>
  );
}
