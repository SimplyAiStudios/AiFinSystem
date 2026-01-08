
import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface CategoryTotalsProps {
  transactions: Transaction[];
}

const CategoryTotals: React.FC<CategoryTotalsProps> = ({ transactions }) => {
  const totals = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    transactions.forEach(t => {
      if (t.amount < 0) { // Only sum expenses
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      }
    });
    return Object.entries(categoryMap)
      .sort(([, a], [, b]) => a - b); // Sort by amount, most negative first
  }, [transactions]);

  if (totals.length === 0) return null;

  return (
    <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Expense Analysis</h3>
      <div className="flex flex-wrap gap-3">
        {totals.map(([category, total]) => (
          <div key={category} className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm shadow-sm transition-transform hover:translate-y-[-2px]">
            <span className="font-bold text-slate-700">{category}</span>
            <span className="ml-3 font-mono font-bold text-rose-600">{Math.abs(total).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryTotals;
