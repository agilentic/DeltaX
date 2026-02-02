
import React from 'react';
import { Transaction } from '../types';

interface HistoryProps {
  transactions: Transaction[];
}

const PaymentHistory: React.FC<HistoryProps> = ({ transactions }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Purchase History</h1>
        <p className="text-gray-500">Track your investments in your mathematical future.</p>
      </header>

      <div className="apple-card apple-shadow bg-white overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center space-y-4">
             <div className="text-5xl opacity-20">🧾</div>
             <p className="text-gray-500 font-medium">No transactions found.</p>
             <p className="text-sm text-gray-400">Purchased books and lessons will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
             {transactions.map(tx => (
               <div key={tx.id} className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
                        {tx.type === 'Lesson' ? '🗓️' : '📚'}
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-900">{tx.item}</h4>
                        <p className="text-xs text-gray-400 font-medium">{new Date(tx.date).toLocaleDateString()} • ID: {tx.id}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-gray-900">£{tx.amount.toFixed(2)}</p>
                     <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded uppercase">Confirmed</span>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      <div className="bg-gray-100 p-6 rounded-2xl flex items-center gap-4 text-sm text-gray-500">
         <span className="text-xl">🛡️</span>
         <p>All payments are processed securely via encrypted infrastructure. Contact WhatsApp support for receipt enquiries.</p>
      </div>
    </div>
  );
};

export default PaymentHistory;
