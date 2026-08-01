'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

interface TrustedHostToggleProps {
  alias: string;
  initialStatus: boolean;
}

export default function TrustedHostToggle({ alias, initialStatus }: TrustedHostToggleProps) {
  const [isTrusted, setIsTrusted] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const newStatus = !isTrusted;
    try {
      const res = await fetch('/api/admin/trusted-hosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_alias: alias,
          is_trusted_host: newStatus
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setIsTrusted(newStatus);
      toast.success(`Updated @${alias} Trusted Host status to ${newStatus ? 'ENABLED' : 'DISABLED'}`);
    } catch (err: any) {
      toast.error(err.message || 'Toggle failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all border ${
        isTrusted
          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      {loading ? 'Updating...' : isTrusted ? 'Trusted Host (Active)' : 'Grant Trusted Host'}
    </button>
  );
}
