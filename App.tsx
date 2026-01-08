
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Transaction } from './types';
import { extractTransactionsFromFiles } from './services/geminiService';
import FileUpload from './components/FileUpload';
import TransactionTable from './components/TransactionTable';
import CategoryTotals from './components/CategoryTotals';
import SummaryStats from './components/SummaryStats';
import AuthPortal from './components/AuthPortal';
import { CopyIcon, FileTextIcon, LoaderIcon, ServerCrashIcon, DownloadIcon, TrashIcon, LogOutIcon, UserIcon } from './components/icons';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('fintracks_session'));
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentFiles, setCurrentFiles] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Load data when user logs in
    useEffect(() => {
        if (currentUser) {
            const users = JSON.parse(localStorage.getItem('fintracks_users') || '{}');
            const userData = users[currentUser];
            if (userData) {
                setTransactions(userData.transactions || []);
                setCustomCategories(userData.customCategories || []);
            }
        } else {
            setTransactions([]);
            setCustomCategories([]);
        }
    }, [currentUser]);

    // Save data whenever transactions or customCategories change
    useEffect(() => {
        if (currentUser) {
            const users = JSON.parse(localStorage.getItem('fintracks_users') || '{}');
            if (users[currentUser]) {
                users[currentUser].transactions = transactions;
                users[currentUser].customCategories = customCategories;
                localStorage.setItem('fintracks_users', JSON.stringify(users));
            }
        }
    }, [transactions, customCategories, currentUser]);

    const handleLogin = (username: string) => {
        setCurrentUser(username);
        localStorage.setItem('fintracks_session', username);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('fintracks_session');
        setTransactions([]);
        setCustomCategories([]);
    };

    const handleFileUpload = async (files: File[]) => {
        if (files.length === 0) return;
        setIsLoading(true);
        setError(null);
        setProgress({ current: 0, total: files.length });
        setCurrentFiles(Array.from(files).map(f => f.name).join(', '));

        try {
            const extracted = await extractTransactionsFromFiles(files, (current) => {
                setProgress(prev => prev ? { ...prev, current } : null);
            });
            
            setTransactions(prev => [...prev, ...extracted]);
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during extraction.');
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    };

    const handleClearAll = () => {
        if (confirm("Are you sure you want to clear all extracted transactions? This will update your cloud storage.")) {
            setTransactions([]);
            setSelectedIds(new Set());
            setError(null);
        }
    };

    const handleDeleteTransaction = useCallback((id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const handleUpdateTransaction = useCallback((updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
        
        // If the updated transaction has a category not in our lists, add it to customCategories
        const defaultCategories = ["Rent", "Insurance", "Subscription", "Groceries", "Dining", "Utilities", "Transport", "Shopping", "Income", "Other"];
        if (updatedTransaction.category && 
            !defaultCategories.includes(updatedTransaction.category) && 
            !customCategories.includes(updatedTransaction.category)) {
            setCustomCategories(prev => [...prev, updatedTransaction.category]);
        }
    }, [customCategories]);

    const handleBulkDelete = useCallback(() => {
        if (confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) {
            setTransactions(prev => prev.filter(t => !selectedIds.has(t.id)));
            setSelectedIds(new Set());
        }
    }, [selectedIds]);

    const handleBulkUpdateCategory = useCallback((newCategory: string) => {
        setTransactions(prev => prev.map(t => 
            selectedIds.has(t.id) ? { ...t, category: newCategory } : t
        ));
        
        const defaultCategories = ["Rent", "Insurance", "Subscription", "Groceries", "Dining", "Utilities", "Transport", "Shopping", "Income", "Other"];
        if (newCategory && 
            !defaultCategories.includes(newCategory) && 
            !customCategories.includes(newCategory)) {
            setCustomCategories(prev => [...prev, newCategory]);
        }
        
        setSelectedIds(new Set());
    }, [selectedIds, customCategories]);
    
    const allCategories = useMemo(() => {
        const defaultCategories = ["Rent", "Insurance", "Subscription", "Groceries", "Dining", "Utilities", "Transport", "Shopping", "Income", "Other"];
        // Combine defaults, explicit custom categories from user profile, and any categories found in current transactions
        const transactionCategories = transactions.map(t => t.category);
        return Array.from(new Set([...defaultCategories, ...customCategories, ...transactionCategories])).filter(Boolean);
    }, [transactions, customCategories]);

    const generateDataString = (delimiter: string = ',') => {
        const header = ["Date", "Description", "Amount", "Category", "Notes"].join(delimiter) + "\n";
        const rows = transactions.map(t => {
            const date = `"${t.date}"`;
            const desc = `"${t.description.replace(/"/g, '""')}"`;
            const amount = t.amount;
            const cat = `"${t.category}"`;
            const notes = `"${t.notes.replace(/"/g, '""')}"`;
            return [date, desc, amount, cat, notes].join(delimiter);
        }).join("\n");
        return header + rows;
    };

    const handleCopyCsv = () => {
        const tsv = generateDataString('\t');
        navigator.clipboard.writeText(tsv)
          .then(() => alert('Data copied to clipboard! You can now paste directly into Google Sheets or Excel.'))
          .catch(err => console.error('Failed to copy: ', err));
    };

    const handleDownloadCsv = () => {
        const csv = generateDataString(',');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `fintracks_${currentUser}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!currentUser) {
        return <AuthPortal onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
            {/* User Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-1.5 rounded-lg">
                            <FileTextIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-700">FINTRACKS</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                            <UserIcon className="h-4 w-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-600">{currentUser}</span>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Sign Out"
                        >
                            <LogOutIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8 md:py-12">
                <header className="text-center mb-8 md:mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Financial Workspace
                    </h1>
                    <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                        Upload your bank statements. AI extracts the data. Everything is saved to your account.
                    </p>
                </header>

                <div className="max-w-4xl mx-auto">
                    <FileUpload onFilesSelected={handleFileUpload} disabled={isLoading} />
                </div>

                {isLoading && (
                    <div className="text-center my-10 animate-pulse">
                        <LoaderIcon className="animate-spin h-12 w-12 text-teal-500 mx-auto" />
                        <p className="mt-4 text-lg text-slate-700 font-bold">
                            {progress ? `Processing file ${progress.current} of ${progress.total}` : 'Analyzing statements...'}
                        </p>
                        <p className="text-slate-500 font-light mt-1 text-sm italic">Extracting: {currentFiles}</p>
                        <div className="max-w-xs mx-auto mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-teal-500 transition-all duration-500 ease-out"
                                style={{ width: progress ? `${(progress.current / progress.total) * 100}%` : '10%' }}
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="max-w-4xl mx-auto my-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-center shadow-sm">
                        <ServerCrashIcon className="h-10 w-10 text-red-500 mx-auto mb-2"/>
                        <p className="font-bold text-red-800">Extraction Error</p>
                        <p className="text-red-600 text-sm">{error}</p>
                        <button 
                            onClick={() => setError(null)}
                            className="mt-3 text-xs font-bold text-red-700 underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {transactions.length > 0 && !isLoading && (
                    <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                                    Saved Records
                                </h2>
                                <button 
                                    onClick={handleClearAll}
                                    className="text-xs flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors font-bold uppercase tracking-widest"
                                >
                                    <TrashIcon className="h-3 w-3" />
                                    Clear History
                                </button>
                            </div>
                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                <button 
                                    onClick={handleCopyCsv} 
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95"
                                    title="Copy for Google Sheets"
                                >
                                    <CopyIcon className="h-5 w-5 text-teal-600"/>
                                    Copy for Sheets
                                </button>
                                <button 
                                    onClick={handleDownloadCsv} 
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                                >
                                    <DownloadIcon className="h-5 w-5"/>
                                    Download CSV
                                </button>
                            </div>
                        </div>
                        
                        <SummaryStats transactions={transactions} />
                        <CategoryTotals transactions={transactions} />

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mt-6">
                            <TransactionTable
                                transactions={transactions}
                                onDelete={handleDeleteTransaction}
                                onUpdate={handleUpdateTransaction}
                                onBulkDelete={handleBulkDelete}
                                onBulkUpdateCategory={handleBulkUpdateCategory}
                                selectedIds={selectedIds}
                                onSelectedIdsChange={setSelectedIds}
                                allCategories={allCategories}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
