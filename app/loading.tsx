import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-accent-gold animate-spin mb-4" />
      <p className="text-white/50 text-sm uppercase tracking-widest animate-pulse">
        Manifesting...
      </p>
    </div>
  );
}
