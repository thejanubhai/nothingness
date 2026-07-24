'use client'

import { useState } from 'react'
import { updateAISettings } from '@/app/actions/ai'
import { Save, BrainCircuit, Activity } from 'lucide-react'
import { toast } from 'sonner' // Already installed

interface LearnedVector {
  id: string
  query: string
  ideal_response: string
  created_at: string
}

interface BrainSettingsProps {
  initialPrompt: string
  initialTemperature: number
  learnedVectors: LearnedVector[]
}

export default function BrainSettings({ initialPrompt, initialTemperature, learnedVectors }: BrainSettingsProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [temperature, setTemperature] = useState(initialTemperature)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await updateAISettings(prompt, temperature)
      if (res.success) {
        toast.success('AI Settings updated successfully')
      } else {
        toast.error('Failed to update settings')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-white/50 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100">
      <div className="flex items-center gap-3 border-b pb-4">
        <BrainCircuit className="w-8 h-8 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">AI Concierge Brain</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">System Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              placeholder="You are a helpful AI assistant..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span>Creativity (Temperature)</span>
              <span className="text-indigo-600">{temperature.toFixed(2)}</span>
            </label>
            <input 
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <p className="text-xs text-gray-500">Higher values make the AI more creative but less predictable.</p>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70"
          >
            {isSaving ? <Activity className="w-5 h-5 animate-pulse" /> : <Save className="w-5 h-5" />}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {/* Learned Vectors Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            Learned Knowledge ({learnedVectors.length})
          </h3>
          <div className="h-96 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {learnedVectors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <BrainCircuit className="w-12 h-12 mb-3 opacity-20" />
                <p>No learned knowledge yet.</p>
                <p className="text-sm">Train the AI from the Inbox.</p>
              </div>
            ) : (
              learnedVectors.map(vec => (
                <div key={vec.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium text-gray-900 mb-1">Q: {vec.query}</div>
                  <div className="text-sm text-gray-600">A: {vec.ideal_response}</div>
                  <div className="text-xs text-gray-400 mt-2 text-right">
                    {new Date(vec.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
