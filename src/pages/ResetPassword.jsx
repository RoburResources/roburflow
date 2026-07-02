import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RoburLogo from "@/components/brand/RoburLogo";

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword: password });
      window.location.href = "/login";
    } catch (err) {
      setError(err?.message || "Could not reset password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-robur-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><RoburLogo dark className="scale-125" /></div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h1 className="text-xl font-extrabold mb-6">Set new password</h1>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>New Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 h-11" /></div>
            <div><Label>Confirm Password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1 h-11" /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              {loading ? "Saving…" : "Reset Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}