import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import RoburLogo from "@/components/brand/RoburLogo";

export default function Register() {
  const [step, setStep] = useState("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep("otp");
    } catch (err) {
      setError(err?.message || "Could not register.");
    } finally {
      setLoading(false);
    }
  };

  const doVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await base44.auth.verifyOtp({ email, otpCode: otp });
      base44.auth.setToken(access_token);
      window.location.href = "/";
    } catch (err) {
      setError(err?.message || "Invalid code.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-robur-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><RoburLogo dark className="scale-125" /></div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {step === "register" ? (
            <>
              <h1 className="text-xl font-extrabold mb-6">Create account</h1>
              <form onSubmit={doRegister} className="space-y-4">
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 h-11" /></div>
                <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 h-11" /></div>
                <div><Label>Confirm Password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1 h-11" /></div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full h-11 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
                  {loading ? "Creating…" : "Create Account"}
                </Button>
              </form>
              <p className="mt-4 text-sm text-center text-slate-500">
                Already have an account? <Link to="/login" className="text-robur-goldDark font-semibold">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-extrabold mb-2">Verify your email</h1>
              <p className="text-sm text-slate-500 mb-6">We sent a code to {email}</p>
              <form onSubmit={doVerify} className="space-y-4">
                <div><Label>Verification Code</Label><Input value={otp} onChange={(e) => setOtp(e.target.value)} required className="mt-1 h-11 tracking-widest text-center" /></div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full h-11 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
                  {loading ? "Verifying…" : "Verify"}
                </Button>
                <button type="button" onClick={() => base44.auth.resendOtp(email)} className="w-full text-sm text-slate-500">Resend code</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}