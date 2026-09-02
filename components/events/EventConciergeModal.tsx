'use client';

import React, { useState } from 'react';
import { Sparkles, Bot, ShieldCheck, ArrowRight, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EventConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    tagline?: string;
    tier: string;
    dress_code?: string;
    price_couples?: number;
    price_females?: number;
    price_males?: number;
    price_nonbinary?: number;
  } | null;
  onApplicationSubmitted: () => void;
}

export default function EventConciergeModal({
  isOpen,
  onClose,
  event,
  onApplicationSubmitted,
}: EventConciergeModalProps) {
  const [step, setStep] = useState<'category' | 'questions' | 'evaluating' | 'result'>('category');
  const [category, setCategory] = useState<'couple' | 'single_female' | 'single_male' | 'non_binary'>('couple');
  const [questions, setQuestions] = useState<Array<{ id: string; question: string; placeholder: string }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [alias, setAlias] = useState<string>('Guest');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !event) return null;

  const handleFetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events/ai-vetting/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          category,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize concierge.');

      setQuestions(data.questions || []);
      setAlias(data.alias || 'Guest');
      setStep('questions');
    } catch (err: any) {
      toast.error('Concierge Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('evaluating');
    setLoading(true);

    try {
      const qaList = questions.map((q) => ({
        question: q.question,
        answer: answers[q.id] || '',
      }));

      const res = await fetch('/api/events/ai-vetting/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          category,
          qaList,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evaluation failed.');

      setEvaluationResult(data.evaluation);
      setStep('result');
      onApplicationSubmitted();
    } catch (err: any) {
      toast.error('Evaluation Error', { description: err.message });
      setStep('questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Select Category */}
        {step === 'category' && (
          <div className="space-y-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono uppercase tracking-widest mb-3">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>Sanctuary Concierge Vetting</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Request Pass for <span className="text-purple-400">{event.title}</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Select your attendance configuration to begin your 60-second micro-vibe check.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'couple', label: 'Couple Pass', desc: 'Paired entry (2 guests)', price: event.price_couples || 3999 },
                { id: 'single_female', label: 'Single Female', desc: 'Autonomous priority pass', price: event.price_females || 1499 },
                { id: 'single_male', label: 'Single Male', desc: 'Vetted balancing queue', price: event.price_males || 4999 },
                { id: 'non_binary', label: 'Queer / Non-Binary', desc: 'Inclusive pass', price: event.price_nonbinary || 1999 },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    category === item.id
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-900/20'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{item.desc}</p>
                  <p className="text-xs font-mono font-bold text-purple-300 mt-2">₹{item.price.toLocaleString()}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleFetchQuestions}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse">Consulting Concierge AI...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Begin 60-Second Vibe Check</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: AI Dynamic Questions */}
        {step === 'questions' && (
          <form onSubmit={handleSubmitAnswers} className="space-y-5 relative z-10">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                  Applicant: @{alias}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">2 Micro-Questions</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Sanctuary Vibe &amp; Boundaries Check</h3>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <label className="block text-xs font-semibold text-zinc-200">
                    <span className="text-purple-400 font-mono mr-1.5">{idx + 1}.</span>
                    {q.question}
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder={q.placeholder}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep('category')}
                className="px-4 py-3 bg-zinc-900 text-zinc-400 font-bold rounded-xl text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit to Concierge</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Evaluating Animation */}
        {step === 'evaluating' && (
          <div className="py-16 text-center space-y-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto animate-bounce">
              <Sparkles className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reviewing Sanctuary Compatibility...</h3>
              <p className="text-xs text-zinc-400 mt-1">Checking boundary clarity, discretion maturity, and room balance.</p>
            </div>
          </div>
        )}

        {/* STEP 4: Evaluation Result */}
        {step === 'result' && evaluationResult && (
          <div className="space-y-6 relative z-10">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Application Recorded</h3>
              <p className="text-xs text-zinc-400 mt-1">Sanctuary Concierge Evaluation Complete</p>
            </div>

            {/* Score Card */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs text-zinc-400">Sanctuary Trust Score</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {evaluationResult.aiTrustScore}/100
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
                <div>Discretion: <span className="text-white font-bold">{evaluationResult.discretionScore}/30</span></div>
                <div>Consent: <span className="text-white font-bold">{evaluationResult.consentScore}/30</span></div>
                <div>Vibe: <span className="text-white font-bold">{evaluationResult.vibeScore}/20</span></div>
                <div>Maturity: <span className="text-white font-bold">{evaluationResult.maturityScore}/20</span></div>
              </div>

              <p className="text-xs text-zinc-300 italic bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                "{evaluationResult.summary}"
              </p>
            </div>

            {evaluationResult.recommendedStatus === 'approved_payment_pending' ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Pass Approved for Checkout!</p>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">
                    Your spot is locked. Please complete ticket checkout to receive your live entry QR.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 flex items-start gap-2.5">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Positioned in Dynamic Balancing Waitlist</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    To maintain strict safe gender ratios, you will receive an automated lockscreen push notification the moment your slot is released.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close &amp; View Status in Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
