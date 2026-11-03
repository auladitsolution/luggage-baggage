"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ShoppingBag, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase/client";
import { signInWithPopup } from "firebase/auth";
import { STORE_INFO } from "@/lib/config/storeInfo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Email / ID & Password Login Flow
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("অনুগ্রহ করে আপনার ইমেইল/আইডি এবং পাসওয়ার্ড লিখুন।");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.trim(),
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "লগইন করতে ব্যর্থ হয়েছে।");
      }

      setSuccess(`স্বাগতম, ${data.user.displayName}! সফলভাবে লগইন হয়েছে।`);

      setTimeout(() => {
        if (redirect && redirect.startsWith("/")) {
          router.push(redirect);
        } else if (data.user.isOwner || data.user.roleSlug === "admin" || data.user.roleSlug === "manager") {
          router.push("/admin");
        } else if (data.user.roleSlug === "cashier") {
          router.push("/pos");
        } else {
          router.push("/account");
        }
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err.message || "লগইন সম্পন্ন করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Sign-in flow (For customers or Google-enabled accounts)
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authProvider: "google",
          idToken,
          firebaseUid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoUrl: user.photoURL,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "লগইন করতে ব্যর্থ হয়েছে");
      }

      setSuccess(`স্বাগতম, ${data.user.displayName}! সফলভাবে লগইন হয়েছে।`);

      setTimeout(() => {
        // Strictly prevent Google accounts from being redirected to /admin or /pos!
        if (redirect && redirect.startsWith("/") && !redirect.startsWith("/admin") && redirect !== "/pos") {
          router.push(redirect);
        } else {
          router.push("/account");
        }
        router.refresh();
      }, 800);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message || "গুগল সাইন-ইন সম্পন্ন করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-6 group">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-lg border border-slate-200/80 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt={STORE_INFO.name}
              width={48}
              height={48}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-brand-navy group-hover:text-brand-teal transition-colors">
              {STORE_INFO.nameBangla}
            </span>
            <span className="block text-[11px] text-brand-muted -mt-1">
              {STORE_INFO.name} • {STORE_INFO.shortAddress}
            </span>
          </div>
        </Link>

        <h2 className="text-center text-xl sm:text-2xl font-black text-brand-navy">
          লগইন ও সাইন-ইন
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          আপনার অনুমোদিত ইমেইল/ইউজার আইডি ও পাসওয়ার্ড দিয়ে প্রবেশ করুন
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200/90 space-y-6">
          {/* Status Feedback */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Primary Form: Email / ID & Password */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ইমেইল অথবা ইউজার আইডি
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder=" ইমেইল অথবা ইউজার আইডি লিখুন "
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-navy hover:bg-brand-teal text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 text-brand-gold" />
              <span>{loading ? "যাচাই করা হচ্ছে..." : "লগইন করুন"}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold absolute">
              অথবা
            </span>
          </div>

          {/* Google Sign-in Option */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs hover:shadow-sm transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google দিয়ে সাইন-ইন করুন</span>
          </button>

          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
              <span>নিরাপত্তা ও অ্যাক্সেস পলিসি:</span>
            </div>
            <p className="leading-relaxed">
              ম্যানেজমেন্ট সেকশন এবং পিওএস কাউন্টারে প্রবেশ করার জন্য স্টোর মালিকের অনুমোদিত আইডি ও পাসওয়ার্ড আবশ্যক। সাধারণ
              গুগল অ্যাকাউন্টে শুধুমাত্র গ্রাহক পোর্টাল ও অর্ডার ট্র্যাকিং উন্মুক্ত।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
