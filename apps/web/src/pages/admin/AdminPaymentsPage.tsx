import React, { useEffect, useState } from 'react';
import { CreditCard, Search, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { WalletTransaction } from '@parkease/shared';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<WalletTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getPayments();
      setPayments(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transaction records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.id || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.type || '').toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout
      title="Financial Transactions"
      subtitle="Audit platform wallet top-ups, booking charges, and payments."
    >
      <div className="bg-white rounded-2xl p-4 border border-[#E8F6EC] shadow-xs mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Transaction ID or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#72C98B]"
          />
        </div>
        <button
          onClick={fetchPayments}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-[#176B4D] hover:bg-gray-100 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#E8F6EC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-[#176B4D] mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">Loading payments log...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600">No payment transactions recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">Wallet activity will be logged here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Tx ID</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#18342A]">
                      {p.id.substring(0, 8)}...
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#18342A]">{p.description}</td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1 font-bold text-[11px] text-gray-700">
                        {p.type === 'TOPUP' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        {p.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-[#18342A]">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
