import type { ReactNode } from "react";

/** Full-bleed photo background with a colorful scrim, used behind the login/register forms. */
export function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100vh-61px)] items-center justify-center overflow-hidden px-4 py-12">
      <img src="/images/hero-driving.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-900/85 via-indigo-900/75 to-slate-900/85" />
      {children}
    </div>
  );
}
