import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import RoburLogo from "@/components/brand/RoburLogo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch { /* always show generic success */ }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-robur-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><RoburLogo dark className="scale-125" /></div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h1 className="text-xl font-extrabold mb-6">Reset password</h1>
          {sent ? (
            <p className="text-sm text-slate-600">If an account exists for {email}, a reset link has been sent.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 h-11" /></div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-sm text-center"><Link to="/login" className="text-robur-goldDark font-semibold">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
}