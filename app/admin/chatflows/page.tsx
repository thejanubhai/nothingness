'use client';

import { useState } from 'react';
import { MessageSquare, Plus, CheckCircle, Save, Settings } from 'lucide-react';

export default function ChatflowsPage() {
  const [flows, setFlows] = useState([
    {
      id: 1,
      name: 'Guest Onboarding Sequence',
      trigger: 'Booking Confirmed',
      channel: 'WhatsApp',
      active: true,
      steps: [
        { type: 'message', content: 'Welcome to Nothingness, {{guest_name}}. Your sanctuary awaits.' },
        { type: 'delay', content: 'Wait 24 hours' },
        { type: 'message', content: 'Please complete your identity verification before check-in: {{verification_link}}' }
      ]
    },
    {
      id: 2,
      name: 'Pre-Arrival Check-in',
      trigger: '2 Days Before Check-in',
      channel: 'Omnichannel (Email + WhatsApp)',
      active: true,
      steps: [
        { type: 'message', content: 'Your stay at {{property_name}} is approaching. Here are your access instructions.' }
      ]
    }
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Omnichannel Chatflows</h1>
          <p className="text-white/50 text-sm tracking-wide">Automate guest communication across WhatsApp, Email, and SMS.</p>
        </div>
        <button className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors">
          <Plus className="w-4 h-4" />
          Create Flow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-serif text-xl text-white mb-4">Active Flows</h3>
          {flows.map(flow => (
            <div key={flow.id} className={`p-4 rounded-xl border cursor-pointer transition-colors ${flow.id === 1 ? 'bg-white/10 border-accent-gold/50' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-white font-medium">{flow.name}</h4>
                {flow.active && <CheckCircle className="w-4 h-4 text-green-400" />}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Trigger: {flow.trigger}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Channel: {flow.channel}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
            <h2 className="font-serif text-2xl text-white">Guest Onboarding Sequence</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg text-white/50 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-6 relative before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-white/10 ml-2">
            
            <div className="relative pl-10">
              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-accent-gold/20 border border-accent-gold flex items-center justify-center -translate-x-[20%]">
                <Settings className="w-4 h-4 text-accent-gold" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Trigger Event</p>
                <p className="text-white text-sm">Booking Confirmed</p>
              </div>
            </div>

            {flows[0].steps.map((step, idx) => (
              <div key={idx} className="relative pl-10">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center -translate-x-[20%]">
                  <MessageSquare className="w-4 h-4 text-white/60" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 group hover:border-accent-gold/30 transition-colors">
                  <div className="flex justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Action: {step.type}</p>
                  </div>
                  <textarea 
                    className="w-full bg-transparent text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-accent-gold/50 rounded p-2 -ml-2"
                    defaultValue={step.content}
                    rows={2}
                  />
                </div>
              </div>
            ))}

            <div className="relative pl-10 pt-4">
              <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent-gold hover:text-white transition-colors">
                <Plus className="w-4 h-4" /> Add Step
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
