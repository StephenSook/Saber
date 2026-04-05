"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, BookOpen, Copy, Check } from "lucide-react";

type Role = "teacher" | "student";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("teacher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joinCodeResult, setJoinCodeResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name,
          email,
          password,
          ...(role === "student" ? { joinCode } : {}),
        }),
      });

      const body = await res.json();

      if (!body.success) {
        setError(body.error ?? "Signup failed.");
        return;
      }

      if (role === "teacher" && body.data?.joinCode) {
        setJoinCodeResult(body.data.joinCode);
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

  const handleCopyCode = async (): Promise<void> => {
    if (!joinCodeResult) return;
    await navigator.clipboard.writeText(joinCodeResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (joinCodeResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10">
              <Check className="h-7 w-7 text-teal" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-navy">Account Created!</h2>
            <p className="mb-6 text-sm text-gray-400">
              Share this class join code with your students so they can sign up and join your class.
            </p>

            <div className="mb-6 flex items-center justify-center gap-3 rounded-xl bg-gray-50 px-6 py-4">
              <span className="font-mono text-3xl font-bold tracking-widest text-navy">
                {joinCodeResult}
              </span>
              <button
                onClick={handleCopyCode}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-navy"
              >
                {copied ? <Check className="h-5 w-5 text-teal" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>

            <button
              onClick={() => {
                router.push("/teacher");
                router.refresh();
              }}
              className="w-full rounded-lg bg-navy py-2.5 text-sm font-medium text-white transition-all hover:scale-[1.01]"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-offwhite">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-navy">
            <BookOpen className="h-7 w-7 text-teal" strokeWidth={2.5} />
            Saber
          </Link>
          <p className="mt-2 text-sm text-gray-400">Create your account</p>
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
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy placeholder:text-gray-300 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                placeholder={role === "teacher" ? "Ms. Rodriguez" : "Maria Gonzalez"}
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-navy">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy placeholder:text-gray-300 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                placeholder="you@school.edu"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-navy">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy placeholder:text-gray-300 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                placeholder="At least 6 characters"
              />
            </div>

            {role === "student" && (
              <div>
                <label htmlFor="joinCode" className="mb-1 block text-sm font-medium text-navy">
                  Class Join Code
                </label>
                <input
                  id="joinCode"
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-mono text-sm uppercase tracking-widest text-navy placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-sans focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                  placeholder="Enter code from your teacher"
                  maxLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-navy py-2.5 text-sm font-medium text-white transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-teal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
