'use client';

import React, { useState } from 'react';
import { Package, AlertCircle, CheckCircle2, RefreshCw, PhoneCall, Truck, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  name: string;
  category: 'Linens & Bedding' | 'Luxury Toiletries' | 'Sensory & Ambience' | 'Minibar & Dining';
  currentStock: number;
  minThreshold: number;
  unit: string;
  vendorName: string;
  vendorPhone: string;
  lastRefill: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Egyptian Cotton Luxury Linen Sets (300 TC)',
    category: 'Linens & Bedding',
    currentStock: 8,
    minThreshold: 4,
    unit: 'Sets',
    vendorName: 'Royal Crest Linen Co. (Local NCR/Hub)',
    vendorPhone: '+91 98112 34567',
    lastRefill: 'Yesterday'
  },
  {
    id: 'inv-2',
    name: 'Plush Microfiber Bath Towel Bundles',
    category: 'Linens & Bedding',
    currentStock: 12,
    minThreshold: 6,
    unit: 'Pairs',
    vendorName: 'Royal Crest Linen Co.',
    vendorPhone: '+91 98112 34567',
    lastRefill: '3 days ago'
  },
  {
    id: 'inv-3',
    name: 'Sensory Amber & Oud Mood Diffuser Refills',
    category: 'Sensory & Ambience',
    currentStock: 2,
    minThreshold: 3,
    unit: 'Bottles',
    vendorName: 'Aura Botanica Curations',
    vendorPhone: '+91 99100 88234',
    lastRefill: '10 days ago'
  },
  {
    id: 'inv-4',
    name: 'Artisanal Bath Salts & Essential Oil Kits',
    category: 'Luxury Toiletries',
    currentStock: 3,
    minThreshold: 5,
    unit: 'Kits',
    vendorName: 'Aura Botanica Curations',
    vendorPhone: '+91 99100 88234',
    lastRefill: '1 week ago'
  },
  {
    id: 'inv-5',
    name: 'Gourmet In-Suite Coffee & Herbal Infusion Packs',
    category: 'Minibar & Dining',
    currentStock: 15,
    minThreshold: 5,
    unit: 'Boxes',
    vendorName: 'Artisan Roast & Brew Supply',
    vendorPhone: '+91 98200 11990',
    lastRefill: '4 days ago'
  }
];

export default function PartnerInventoryManager() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [refillingId, setRefillingId] = useState<string | null>(null);

  const handleRefillOrder = async (item: InventoryItem) => {
    setRefillingId(item.id);
    try {
      const res = await fetch('/api/partner/inventory/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          itemName: item.name,
          vendorName: item.vendorName,
          vendorPhone: item.vendorPhone
        })
      });

      if (!res.ok) throw new Error('Refill dispatch failed');

      // Update local state
      setInventory((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, currentStock: i.currentStock + 10, lastRefill: 'Just now' } : i
        )
      );

      toast.success(`Refill Dispatched: ${item.name}`, {
        description: `Automated order ping sent to ${item.vendorName}.`
      });
    } catch (err) {
      toast.error('Refill order failed. Please contact vendor directly.');
    } finally {
      setRefillingId(null);
    }
  };

  const adjustStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStock = Math.max(0, item.currentStock + delta);
          return { ...item, currentStock: newStock };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl text-white">
            Hyperlocal Inventory &amp; Vendor Supply Chain
          </h3>
          <p className="text-white/60 text-xs sm:text-sm mt-0.5">
            Automated stock tracking and 1-click replenishment with tied-up local luxury vendors.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white/[0.03] border border-white/10 px-3.5 py-2 rounded-xl text-white/70">
          <Truck className="w-4 h-4 text-accent-gold" />
          <span>Local Partner SLA: &lt; 24h Restock</span>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((item) => {
          const isLowStock = item.currentStock <= item.minThreshold;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isLowStock
                  ? 'bg-rose-500/[0.04] border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {item.category}
                  </span>
                  {isLowStock ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      <AlertCircle className="w-3 h-3" /> Low Stock
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Stocked
                    </span>
                  )}
                </div>

                <h4 className="font-serif text-sm font-semibold text-white mt-1 leading-snug">
                  {item.name}
                </h4>

                <div className="flex items-center justify-between mt-4 py-2 border-y border-white/5">
                  <span className="text-[11px] text-white/50 font-mono">Current Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustStock(item.id, -1)}
                      className="w-6 h-6 rounded bg-white/5 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={`font-mono text-sm font-bold ${isLowStock ? 'text-rose-400' : 'text-accent-gold'}`}>
                      {item.currentStock} {item.unit}
                    </span>
                    <button
                      onClick={() => adjustStock(item.id, 1)}
                      className="w-6 h-6 rounded bg-white/5 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 text-[11px] text-white/50 space-y-1">
                  <p>
                    <span className="text-white/30 font-mono">Vendor:</span>{' '}
                    <span className="text-white/70">{item.vendorName}</span>
                  </p>
                  <p>
                    <span className="text-white/30 font-mono">Last Refill:</span>{' '}
                    <span className="text-white/60 font-mono">{item.lastRefill}</span>
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-4 border-t border-white/5">
                <button
                  type="button"
                  disabled={refillingId === item.id}
                  onClick={() => handleRefillOrder(item)}
                  className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isLowStock
                      ? 'bg-rose-500 hover:bg-rose-400 text-black'
                      : 'bg-white/10 hover:bg-white hover:text-black text-white'
                  }`}
                >
                  {refillingId === item.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5" />
                      <span>{isLowStock ? 'Auto-Dispatch Refill' : 'Order Restock'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
