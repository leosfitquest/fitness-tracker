import React from "react";

type BottomNavProps = {
  currentPage: "dashboard" | "exercises" | "account";
  onNavigate: (page: "dashboard" | "exercises" | "account") => void;
};

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => onNavigate("dashboard")}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all ${
              currentPage === "dashboard"
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate("exercises")}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all ${
              currentPage === "exercises"
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span className="text-xs font-medium">Exercises</span>
          </button>

          <button
            onClick={() => onNavigate("account")}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all ${
              currentPage === "account"
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs font-medium">Account</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
