"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-dash-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
            <rect fill="#cbdc2a" width="1080" height="1080"/>
            <polygon fill="#181613" points="840 533.94 840 331.39 540 158.19 240 331.39 240 443.02 700.22 709.02 643.25 709.02 540 768.63 372.66 672.02 372.66 621.73 240 545.14 240 748.61 540 921.81 840 748.61 840 636.06 379.78 370.57 437.47 370.57 540 311.37 707.34 407.98 707.34 457.35 840 533.94"/>
          </svg>
          <h1 className="text-2xl font-semibold text-dash-text">Springer OS</h1>
          <p className="text-dash-text-muted text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dash-text mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-dash-surface-2 border border-dash-border rounded-md text-dash-text placeholder-dash-text-dim focus:outline-none focus:ring-2 focus:ring-dash-accent focus:border-transparent"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-dash-text mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-dash-surface-2 border border-dash-border rounded-md text-dash-text placeholder-dash-text-dim focus:outline-none focus:ring-2 focus:ring-dash-accent focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
