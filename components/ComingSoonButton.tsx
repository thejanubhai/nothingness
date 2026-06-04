'use client';

import { toast } from 'sonner';

interface Props {
  text: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function ComingSoonButton({ text, icon, className }: Props) {
  return (
    <button 
      onClick={() => toast.info(`${text} is coming soon!`)}
      className={className || "flex items-center gap-2 bg-accent-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors"}
    >
      {icon}
      {text}
    </button>
  );
}
