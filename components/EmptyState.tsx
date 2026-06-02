import { FolderOpen } from 'lucide-react';
import React from 'react';

export default function EmptyState({ 
  title = "No data found", 
  message = "There's nothing to display here yet.",
  icon = <FolderOpen className="w-12 h-12 text-white/20 mb-4" />
}: { 
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-2xl">
      {icon}
      <h3 className="font-serif text-xl text-white mb-2">{title}</h3>
      <p className="text-white/50 text-sm max-w-sm text-center">{message}</p>
    </div>
  );
}
