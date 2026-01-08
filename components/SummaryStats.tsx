
import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface SummaryStatsProps {
  transactions: Transaction[];
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ transactions }) => {
  const stats = useMemo(() => {
    let income = 0;
    let spending = 0;
    transactions.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else spending += t.amount;
    });

    return {
      totalRecords: transactions.length,
      totalIncome: income,
      totalSpending: spending,
      netTotal: income + spending,
    };
  }, [transactions]);

  const formatCurrency = (val: number) =>
    Math.abs(val).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
        <p className="text-3xl font-black text-slate-800">{stats.totalRecords}</p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Transactions parsed</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-emerald-500">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
        <p className="text-3xl font-black text-emerald-600">{formatCurrency(stats.totalIncome)}</p>
        <p className="text-[10px] text-emerald-600/70 mt-1 uppercase font-semibold">Deposits & Credits</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-rose-500">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Spending</p>
        <p className="text-3xl font-black text-rose-600">{formatCurrency(stats.totalSpending)}</p>
        <p className="text-[10px] text-rose-600/70 mt-1 uppercase font-semibold">Expenses & Payments</p>
      </div>

      <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 ${stats.netTotal >= 0 ? 'border-l-teal-500' : 'border-l-amber-500'}`}>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Net Balance</p>
        <p className={`text-3xl font-black ${stats.netTotal >= 0 ? 'text-teal-600' : 'text-amber-600'}`}>
            {stats.netTotal < 0 && '-'}{formatCurrency(stats.netTotal)}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Statement Cash Flow</p>
      </div>
    </div>
  );
};

export default SummaryStats;
