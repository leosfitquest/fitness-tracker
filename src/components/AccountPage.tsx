import React from "react";
import { supabase } from "../lib/supabase";

type AccountPageProps = {
  user: any;
};

export const AccountPage: React.FC<AccountPageProps> = ({ user }) => {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Account</h1>
        <p className="text-slate-400 text-sm">{user?.email}</p>
      </div>

      {/* Profile */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2">User ID</label>
            <input
              type="text"
              value={user?.id || ""}
              disabled
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none opacity-50 cursor-not-allowed font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
            <span className="text-sm">Theme</span>
            <span className="text-xs text-slate-400">Dark (Light coming soon)</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
            <span className="text-sm">Mode</span>
            <span className="text-xs text-slate-400">Expert (Beginner coming soon)</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full py-3 rounded-lg bg-red-500/10 border border-red-900 text-red-400 hover:bg-red-500/20 font-medium transition-all"
      >
        Sign Out
      </button>

      <div className="text-center mt-6 text-xs text-slate-600">
        Version 1.0.0 Beta
      </div>
    </div>
  );
};
