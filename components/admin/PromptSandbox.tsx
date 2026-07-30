'use client';

import { useState } from 'react';
import { Sparkles, Play, Bot, User, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { testGeminiPrompt } from '@/app/actions/ai';

const PROMPT_PRESETS = [
  {
    id: 'luxury-concierge',
    name: 'Ultra-Luxury Concierge',
    description: 'Sophisticated, elegant, and warm tone tailored for high-net-worth guests.',
    prompt: `You are the AI Concierge for Nothingness, an ultra-exclusive luxury sanctuary brand. 
Maintain a warm, refined, and understated tone. 
Always refer to properties as "Sanctuaries" or "Chambers". 
Answer guest questions regarding check-in times (3:00 PM), check-out times (11:00 AM), privacy policies, and bespoke amenities with maximum courtesy. 
If a request requires bespoke human arrangement, offer to notify the Private Butler team.`,
    sampleQuery: 'What time can we check in, and can we request a private chef for dinner?',
  },
  {
    id: 'policy-verification',
    name: 'Verification & Policy Guide',
    description: 'Direct, clear guidance regarding ID upload procedures and safety regulations.',
    prompt: `You are the Virtual Front Desk Assistant for Nothingness. 
Your priority is explaining guest identity verification, check-in requirements, and sanctuary safety. 
Remind guests that mandatory ID verification requires a valid Indian Aadhaar Card or International Passport for guests aged 18+. 
Keep responses concise, clear, and reassuring.`,
    sampleQuery: 'Why do I need to upload my ID document before receiving check-in instructions?',
  },
  {
    id: 'emergency-escalation',
    name: 'Escalation Specialist',
    description: 'Focuses on detecting guest friction or urgent requests and routing to human staff.',
    prompt: `You are the AI Triage Specialist for Nothingness. 
Help guests with immediate inquiries. If a guest expresses dissatisfaction, urgent maintenance needs, or booking changes, respond with immediate empathy and trigger human agent escalation.`,
    sampleQuery: 'The main pool temperature feels too cold and I need help with wifi immediately.',
  },
];

export default function PromptSandbox({
  currentPrompt,
  temperature,
  onApplyPrompt,
}: {
  currentPrompt: string;
  temperature: number;
  onApplyPrompt: (prompt: string) => void;
}) {
  const [testQuery, setTestQuery] = useState('Can I get early check-in at 1:00 PM tomorrow?');
  const [activePromptText, setActivePromptText] = useState(currentPrompt || PROMPT_PRESETS[0].prompt);
  const [isTesting, setIsTesting] = useState(false);
  const [testHistory, setTestHistory] = useState<Array<{ query: string; reply: string; timestamp: string }>>([]);

  const handleApplyPreset = (presetPrompt: string, sampleQuery?: string) => {
    setActivePromptText(presetPrompt);
    onApplyPrompt(presetPrompt);
    if (sampleQuery) setTestQuery(sampleQuery);
    toast.success('Preset prompt loaded into editor');
  };

  const handleRunSimulation = async () => {
    if (!testQuery.trim()) {
      toast.error('Please enter a test query');
      return;
    }
    setIsTesting(true);
    try {
      const res = await testGeminiPrompt(activePromptText, testQuery, temperature);
      if (res.success && res.reply) {
        setTestHistory((prev) => [
          {
            query: testQuery,
            reply: res.reply,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        toast.success('Gemini simulation complete');
      } else {
        toast.error(res.error || 'Failed to simulate prompt');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulation error';
      toast.error(msg);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/5">
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-gold" />
            Gemini 2.5 Prompt Sandbox &amp; Preset Tuning
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Test prompt performance live against simulated guest inquiries before saving.
          </p>
        </div>
      </div>

      {/* Preset Library */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Select Prompt Template Preset</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PROMPT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.prompt, preset.sampleQuery)}
              className="text-left p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-accent-gold/40 rounded-xl transition-all group"
            >
              <p className="text-xs font-medium text-white group-hover:text-accent-gold transition-colors flex items-center justify-between">
                {preset.name}
              </p>
              <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Simulation Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Input Test Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
              Active System Directive (Editable)
            </label>
            <textarea
              value={activePromptText}
              onChange={(e) => {
                setActivePromptText(e.target.value);
                onApplyPrompt(e.target.value);
              }}
              rows={6}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50 font-mono resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
              Simulated Guest Input
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Enter test message..."
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50"
              />
              <button
                onClick={() => void handleRunSimulation()}
                disabled={isTesting}
                className="flex items-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-black px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                Run Test
              </button>
            </div>
          </div>
        </div>

        {/* Simulation Output Log */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col min-h-[260px] max-h-[360px] overflow-y-auto space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40 sticky top-0 bg-black/80 backdrop-blur-md py-1 border-b border-white/5">
            Gemini Response Output Log
          </p>

          {testHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-xs py-8">
              <Bot className="w-8 h-8 opacity-20 mb-2" />
              <p>No prompt simulations executed yet.</p>
              <p className="text-[10px] text-white/20 mt-1">Click &quot;Run Test&quot; to evaluate your prompt directive.</p>
            </div>
          ) : (
            testHistory.map((item, idx) => (
              <div key={idx} className="space-y-2 border-b border-white/5 pb-3 text-xs">
                <div className="flex items-start gap-2 text-white/70">
                  <User className="w-3.5 h-3.5 text-white/40 mt-0.5 flex-shrink-0" />
                  <p className="font-medium text-white/90">{item.query}</p>
                </div>
                <div className="flex items-start gap-2 bg-white/[0.03] p-3 rounded-lg border border-white/5 text-white/80 leading-relaxed font-sans">
                  <Bot className="w-3.5 h-3.5 text-accent-gold mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{item.reply}</p>
                    <p className="text-[9px] font-mono text-white/30 mt-2 text-right">{item.timestamp}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
