
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Transaction } from '../types';
import { TrashIcon, CheckIcon, EditIcon } from './icons';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (transaction: Transaction) => void;
  onBulkDelete: () => void;
  onBulkUpdateCategory: (category: string) => void;
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  allCategories: string[];
}

const TransactionRow: React.FC<{
    transaction: Transaction;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (transaction: Transaction) => void;
    allCategories: string[];
}> = ({ transaction, isSelected, onToggleSelect, onDelete, onUpdate, allCategories }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [category, setCategory] = useState(transaction.category);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep local category state in sync with transaction prop when not editing
    useEffect(() => {
        if (!isEditing) {
            setCategory(transaction.category);
        }
    }, [transaction.category, isEditing]);

    useEffect(() => {
        if (isEditing && isAddingNew) {
            inputRef.current?.focus();
        }
    }, [isEditing, isAddingNew]);

    const handleSave = () => {
        const finalCategory = isAddingNew && newCategory.trim() !== "" ? newCategory.trim() : category;
        onUpdate({ ...transaction, category: finalCategory });
        setIsEditing(false);
        setIsAddingNew(false);
        setNewCategory("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setIsAddingNew(false);
            setCategory(transaction.category);
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "ADD_NEW") {
            setIsAddingNew(true);
            setNewCategory("");
        } else {
            setCategory(e.target.value);
            setIsAddingNew(false);
        }
    };
    
    const amountColor = transaction.amount >= 0 ? 'text-emerald-600' : 'text-rose-600';

    return (
        <tr className={`border-b border-slate-100 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
            <td className="p-3 text-center">
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => onToggleSelect(transaction.id)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
            </td>
            <td className="p-3 text-sm text-slate-600 whitespace-nowrap">{transaction.date}</td>
            <td className="p-3 text-sm text-slate-800 font-medium">{transaction.description}</td>
            <td className={`p-3 text-sm font-mono font-bold text-right whitespace-nowrap ${amountColor}`}>
                {transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </td>
            <td className="p-3 text-sm min-w-[150px]">
                {isEditing ? (
                    <div className="flex flex-col gap-1">
                        {!isAddingNew ? (
                             <select
                                value={category}
                                onChange={handleCategoryChange}
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-sm w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                            >
                                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="ADD_NEW" className="font-bold text-teal-600">+ Create New...</option>
                            </select>
                        ) : (
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter category name..."
                                    className="bg-white border border-teal-300 rounded px-2 py-1 text-sm w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                                 />
                                 <button 
                                    onClick={() => setIsAddingNew(false)}
                                    className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
                                    title="Go back to list"
                                 >
                                    Back
                                 </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="bg-slate-100 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full border border-teal-100 uppercase tracking-wide inline-block">
                        {transaction.category}
                    </span>
                )}
            </td>
            <td className="p-3 text-sm text-slate-500 italic max-w-xs truncate" title={transaction.notes}>
                {transaction.notes}
            </td>
            <td className="p-3 text-center">
                <div className="flex items-center justify-center gap-3">
                    {isEditing ? (
                         <button onClick={handleSave} title="Save Changes" className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 bg-emerald-50 rounded-md">
                            <CheckIcon className="h-5 w-5" />
                        </button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} title="Edit Category" className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-md">
                            <EditIcon className="h-5 w-5" />
                        </button>
                    )}
                    <button onClick={() => onDelete(transaction.id)} title="Delete Row" className="text-rose-400 hover:text-rose-600 transition-colors p-1 hover:bg-rose-50 rounded-md">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const TransactionTable: React.FC<TransactionTableProps> = ({ 
    transactions, 
    onDelete, 
    onUpdate, 
    onBulkDelete, 
    onBulkUpdateCategory, 
    selectedIds, 
    onSelectedIdsChange, 
    allCategories 
}) => {
    const handleToggleSelectAll = () => {
        if (selectedIds.size === transactions.length) {
            onSelectedIdsChange(new Set());
        } else {
            onSelectedIdsChange(new Set(transactions.map(t => t.id)));
        }
    };

    const handleToggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        onSelectedIdsChange(next);
    };

    const totals = useMemo(() => {
        let income = 0;
        let spending = 0;
        transactions.forEach(t => {
            if (t.amount > 0) income += t.amount;
            else spending += t.amount;
        });
        return { income, spending, net: income + spending, count: transactions.length };
    }, [transactions]);

    const formatCurrency = (val: number) =>
        val.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        });

    return (
        <div className="relative">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur p-4 shadow-md border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-teal-600">
                            {selectedIds.size} transactions selected
                        </span>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                        <div className="flex items-center gap-3">
                            <label className="text-xs text-slate-500 uppercase font-black tracking-tight">Bulk Category:</label>
                            <select 
                                onChange={(e) => {
                                    if(e.target.value) onBulkUpdateCategory(e.target.value);
                                    e.target.value = "";
                                }}
                                className="bg-slate-50 border border-slate-200 rounded text-sm px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                                <option value="">Select category...</option>
                                {allCategories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button 
                        onClick={onBulkDelete}
                        className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold rounded-lg border border-rose-100 transition-colors"
                    >
                        <TrashIcon className="h-4 w-4" />
                        Delete Selected
                    </button>
                </div>
            )}

            <table className="w-full table-auto">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 text-center w-12">
                            <input 
                                type="checkbox" 
                                checked={transactions.length > 0 && selectedIds.size === transactions.length}
                                onChange={handleToggleSelectAll}
                                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                        </th>
                        <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                        <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Description</th>
                        <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                        <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Category</th>
                        <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Notes</th>
                        <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {transactions.map(t => (
                        <TransactionRow
                            key={t.id}
                            transaction={t}
                            isSelected={selectedIds.has(t.id)}
                            onToggleSelect={handleToggleSelect}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            allCategories={allCategories}
                        />
                    ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                        <td colSpan={3} className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Table Totals ({totals.count} Records):
                        </td>
                        <td className="p-4 text-right">
                           <div className="flex flex-col items-end gap-1">
                                <div className="text-[10px] font-bold text-emerald-600 uppercase">In: {formatCurrency(totals.income)}</div>
                                <div className="text-[10px] font-bold text-rose-600 uppercase">Out: {formatCurrency(totals.spending)}</div>
                                <div className={`text-sm font-black border-t border-slate-300 pt-1 ${totals.net >= 0 ? 'text-teal-600' : 'text-amber-600'}`}>
                                    {formatCurrency(totals.net)}
                                </div>
                           </div>
                        </td>
                        <td colSpan={3} className="bg-slate-50"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default TransactionTable;
