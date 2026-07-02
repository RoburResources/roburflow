import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import RoburLogo from "@/components/brand/RoburLogo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err?.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-robur-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <RoburLogo dark className="scale-125" />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h1 className="text-xl font-extrabold text-robur-black mb-1">Field Operations</h1>
          <p className="text-sm text-slate-500 mb-6">Sign in to continue</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 h-11" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 h-11" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <Link to="/forgot-password" className="text-slate-500 hover:text-robur-black">Forgot password?</Link>
            <Link to="/register" className="text-robur-goldDark font-semibold">Create account</Link>
          </div>
          <button
            onClick={() => base44.auth.loginWithProvider("google", "/")}
            className="mt-4 w-full h-11 border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}