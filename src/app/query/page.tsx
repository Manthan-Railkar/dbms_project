'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SqlQueryStudio from '@/components/SqlQueryStudio';

export default function QueryPage() {
  return (
    <main className="min-h-screen bg-[#080d1a] p-3 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Match Setup</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono">DBMS Live Cricket Tracker &bull; SQL Studio</span>
      </div>

      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
        <SqlQueryStudio isModal={false} />
      </div>
    </main>
  );
}
