'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';

export function FounderGate({ children }: { children: React.ReactNode }) {
  const { user, token, ready, hydrate } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // The login page lives under /founder, so it shares this layout. It must
  // render UNGATED — otherwise the gate hides the very form needed to log in
  // (a circular lock: you'd have to be authenticated to see the login form).
  const isLoginRoute = pathname === '/founder/login';

  useEffect(() => { if (!ready) hydrate(); }, [ready, hydrate]);
  useEffect(() => {
    if (!isLoginRoute && ready && (!token || !user)) router.replace('/founder/login');
  }, [isLoginRoute, ready, token, user, router]);

  // Always render the login route's children straight through.
  if (isLoginRoute) return <>{children}</>;

  if (!ready) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-obsidian-radial">
        <div className="h-10 w-10 rounded-full border-2 border-gold-500/30 border-t-gold-400 animate-spin" />
      </div>
    );
  }
  if (!user) return null;
  if (!user.is_admin) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-obsidian-radial">
        <div className="glass rounded-2xl p-8 text-center max-w-sm">
          <div className="text-empire-danger text-3xl mb-3">⊘</div>
          <div className="font-display font-bold text-lg text-gold-liquid">Founder Access Only</div>
          <p className="text-white/50 text-sm mt-2">This control center is restricted to the Founder account.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
