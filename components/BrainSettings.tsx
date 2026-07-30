'use client';

import { useState } from 'react';
import { updateAISettings } from '@/app/actions/ai';
import { Save, BrainCircuit, Activity, Sparkles, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import PromptSandbox from '@/components/admin/PromptSandbox';

interface LearnedVector {
  id: string;
  query: string;
  ideal_response: string;
  created_at: string;
}

interface BrainSettingsProps {
  initialPrompt: string;
  initialTemperature: number;
  learnedVectors: LearnedVector[];
}

export default function BrainSettings({ initialPrompt, initialTemperature, learnedVectors }: BrainSettingsProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateAISettings(prompt, temperature);
      if (res.success) {
        toast.success('AI Concierge Brain Settings saved successfully');
      } else {
        toast.error('Failed to update AI settings');
      }
    } catch (err) {
      toast.error('An error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header Card */}
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent-gold/10 border border-accent-gold/20 rounded-xl text-accent-gold">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-white">AI Concierge Brain Settings</h2>
            <p className="text-xs text-white/50">
              Configure system directive prompts, temperature controls, and vector knowledge memory.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-black px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {isSaving ? <Activity className="w-4 h-4 animate-pulse" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving...' : 'Save AI Settings'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Directives & Temperature */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Sandbox Component */}
          <PromptSandbox
            currentPrompt={prompt}
            temperature={temperature}
            onApplyPrompt={(newPrompt) => setPrompt(newPrompt)}
          />

          {/* Controls */}
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Creativity & Variance (Temperature)
              </label>
              <span className="text-xs font-mono text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-md border border-accent-gold/20">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-accent-gold cursor-pointer"
            />
            <p className="text-[11px] text-white/40">
              Lower values (0.2–0.5) produce deterministic, fact-driven outputs. Higher values (0.7–1.2) enable warm, creative conversational phrasing.
            </p>
          </div>
        </div>

        {/* Right Column: Learned Knowledge Base */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col h-full">
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-accent-gold" />
              Learned Knowledge ({learnedVectors.length})
            </h3>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] space-y-3 pr-1">
              {learnedVectors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/30 text-center">
                  <BrainCircuit className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs font-medium">No learned vector entries yet.</p>
                  <p className="text-[10px] text-white/20 mt-1 max-w-[200px]">
                    Train the AI concierge directly from resolved guest threads in the Admin Inbox.
                  </p>
                </div>
              ) : (
                learnedVectors.map((vec) => (
                  <div key={vec.id} className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                    <p className="text-xs font-medium text-white/90 mb-1">Q: {vec.query}</p>
                    <p className="text-xs text-white/60 leading-relaxed">A: {vec.ideal_response}</p>
                    <p className="text-[9px] font-mono text-white/30 mt-2 text-right">
                      {new Date(vec.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
