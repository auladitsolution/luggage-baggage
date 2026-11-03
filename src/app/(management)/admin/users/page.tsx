"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Shield, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  UserPlus, 
  Lock, 
  Mail, 
  Phone, 
  User as UserIcon,
  Crown
} from "lucide-react";
import { DEFAULT_ROLES } from "@/lib/constants/permissions";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New staff registration form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ইউজার তালিকা লোড করতে ব্যর্থ হয়েছে");
      }
      setUsers(data.users || []);
      if (data.roles && data.roles.length > 0) {
        setRoles(data.roles);
        if (!roleId) {
          const defaultStaffRole = data.roles.find((r: any) => r.slug === "cashier") || data.roles[0];
          setRoleId(defaultStaffRole._id);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email: email.trim() || undefined,
          username: username.trim() || undefined,
          password,
          roleId,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "কর্মী তৈরি করতে ব্যর্থ হয়েছে");
      }

      setSuccess("নতুন কর্মী সফলভাবে সিস্টেমে যুক্ত করা হয়েছে!");
      setDisplayName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setPhone("");
      setShowAddForm(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    if (user.isOwner) {
      alert("স্টোর ওনার অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না।");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          isActive: !user.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি");
      }

      setSuccess(`ইউজার স্ট্যাটাস সফলভাবে ${!user.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে।`);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || newPassword.length < 6) {
      alert("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resetModalUser._id,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে");
      }

      setSuccess(`${resetModalUser.displayName}-এর পাসওয়ার্ড সফলভাবে আপডেট হয়েছে।`);
      setResetModalUser(null);
      setNewPassword("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy tracking-tight">
            স্টাফ ও পারমিশন ম্যানেজমেন্ট
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            মালিকের অনুমতি সাপেক্ষে কর্মী তৈরি করুন, আইডি-পাসওয়ার্ড প্রদান করুন এবং এক্সেস নিয়ন্ত্রণ করুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{showAddForm ? "ফর্ম বন্ধ করুন" : "নতুন কর্মী যোগ করুন"}</span>
          </button>
          <button
            onClick={loadUsers}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 1. Official Store Owners Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-teal/5 to-slate-50 border border-amber-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-brand-navy flex items-center justify-center font-bold shadow-xs">
            <Crown className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                দোকান মালিক: Md. Sohel Sikder & Md. Alam
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                মূল নিয়ন্ত্রক (Owner)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              অফিশিয়াল ইমেইল: <span className="font-mono font-medium text-slate-800">luggage.baggage26@gmail.com</span> | ফুল অ্যাডমিন ও ফাইন্যান্স অ্যাক্সেস
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-600 bg-white/80 backdrop-blur px-3 py-2 rounded-xl border border-amber-200/60">
          <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            ম্যানেজমেন্ট সেকশন সম্পূর্ণ সুরক্ষিত
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            অনুমতিপ্রাপ্ত স্টাফ ও মালিক ছাড়া অন্য কেউ প্রবেশ করতে পারবে না
          </span>
        </div>
      </div>

      {/* 2. Add New Staff Form */}
      {showAddForm && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 transition-all">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="w-4 h-4 text-brand-navy" />
            <h3 className="text-sm font-bold text-brand-navy">
              নতুন কর্মী / স্টাফ পারমিশন তৈরি ফর্ম
            </h3>
          </div>

          <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  কর্মীর পূর্ণ নাম *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="যেমন: মোঃ কামরুল ইসলাম"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ই-মেইল (লগইনের জন্য)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@luggagebaggage.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  স্টাফ আইডি / ইউজারনেম
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="যেমন: kamrul_pos অথবা 01869749988"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  লগইন পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  দায়িত্ব / পদবি (রোল) *
                </label>
                <select
                  required
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy bg-white font-medium"
                >
                  {roles
                    .filter((r) => r.slug !== "owner" && r.slug !== "customer")
                    .map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.nameBangla} ({r.slug})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ফোন নম্বর (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 disabled:opacity-50 text-white font-bold transition-colors shadow-xs"
              >
                {isSubmitting ? "যুক্ত করা হচ্ছে..." : "নতুন কর্মীর অ্যাকাউন্ট তৈরি করুন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. System Roles Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-teal" />
          <span>অনুমোদিত রোল ও ক্ষমতার বিবরণ</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(DEFAULT_ROLES).map((role) => (
            <div
              key={role.slug}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-brand-navy">{role.nameBangla}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  {role.slug}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {role.description}
              </p>
              <span className="text-[10px] text-brand-teal font-semibold block pt-1">
                অনুমোদিত পারমিশন: {role.permissions.length} টি
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Staff & Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-teal" />
            <span>সিস্টেমে অনুমোদিত ব্যবহারকারী তালিকা ({users.length} জন)</span>
          </h3>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            বর্তমানে কোনো কর্মী ডাটাবেসে সেভ নেই। ওপরের বাটনে ক্লিক করে নতুন কর্মী তৈরি করুন।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">নাম ও পরিচিতি</th>
                  <th className="py-3 px-4">ইমেইল / ইউজারনেম</th>
                  <th className="py-3 px-4">পদবি / রোল</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4">সর্বশেষ লগইন</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-brand-navy flex items-center gap-1.5">
                        {u.displayName}
                        {u.isOwner && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[9px]">
                            মালিক
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {u.username ? `ID: ${u.username}` : `UID: ${u.firebaseUid || u._id}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>{u.email || "-"}</div>
                      {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-teal-50 text-brand-teal border border-teal-200 font-semibold text-[11px]">
                        {u.roleId?.nameBangla || u.roleId?.name || "সাধারণ কাস্টমার"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          সক্রিয়
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          নিষ্ক্রিয়
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("bn-BD") : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!u.isOwner && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword("");
                            }}
                            className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-[11px]"
                          >
                            পাসওয়ার্ড পরিবর্তন
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2 py-1 rounded-lg font-medium text-[11px] ${
                              u.isActive
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {u.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-teal" />
              <span>{resetModalUser.displayName}-এর পাসওয়ার্ড পরিবর্তন</span>
            </h3>
            <p className="text-xs text-slate-600">
              এই কর্মীর জন্য একটি নতুন পাসওয়ার্ড সেট করুন। কর্মী এই নতুন পাসওয়ার্ড দিয়ে সিস্টেমে লগইন করতে পারবেন।
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="যেমন: staff@2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-navy font-mono text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-xs text-white font-bold shadow-xs"
                >
                  পাসওয়ার্ড আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
