"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export function UserNav() {
  return (
    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="truncate">
          <span className="text-xs font-semibold text-slate-800 block truncate">Admin</span>
          <span className="text-[10px] text-slate-400 block truncate">admin@algoritmojuridico.com</span>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        title="Cerrar Sesión"
        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
