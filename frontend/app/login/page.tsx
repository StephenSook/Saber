"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, BookOpen } from "lucide-react";

type Role = "teacher" | "student";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const body = await res.json();

      if (!body.success) {
        setError(body.error ?? "Login failed.");
        return;
      }

      router.push(role === "teacher" ? "/teacher" : "/student");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-offwhite">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-navy">
            <BookOpen className="h-7 w-7 text-teal" strokeWidth={2.5} />
            Saber
          </Link>
          <p className="mt-2 text-sm text-gray-400">Sign in to your account</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex rounded-lg bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                role === "teacher"
                  ? "bg-white text-navy shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Teacher
            </button>
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                role === "student"
                  ? "bg-white text-navy shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Student
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-coral/20 bg-coral/5 px-4 py-3 text-sm text-coral">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy placeholder:text-gray-300 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                placeholder="you@school.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy placeholder:text-gray-300 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-navy py-2.5 text-sm font-medium text-white transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-teal hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
