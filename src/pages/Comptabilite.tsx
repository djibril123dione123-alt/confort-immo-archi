import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function Comptabilite() {
  const [stats, setStats] = useState({
    totalRevenus: 0,
    totalDepenses: 0,
    soldeNet: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;

      const [revenusRes, depensesRes, paiementsRes] = await Promise.all([
        supabase.from('revenus').select('montant, date_revenu').gte('date_revenu', startDate),
        supabase.from('depenses').select('montant, date_depense').gte('date_depense', startDate),
        supabase.from('paiements').select('part_agence, mois_concerne, statut').gte('mois_concerne', startDate).eq('statut', 'paye'),
      ]);

      const totalRevenus = (paiementsRes.data || []).reduce((sum, p) => sum + Number(p.part_agence), 0);
      const totalDepenses = (depensesRes.data || []).reduce((sum, d) => sum + Number(d.montant), 0);

      setStats({
        totalRevenus,
        totalDepenses,
        soldeNet: totalRevenus - totalDepenses,
      });

      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const data = months.map((month, index) => {
        const monthStr = `${currentYear}-${String(index + 1).padStart(2, '0')}`;

        const revenus = (paiementsRes.data || [])
          .filter(p => p.mois_concerne.startsWith(monthStr))
          .reduce((sum, p) => sum + Number(p.part_agence), 0);

        const depenses = (depensesRes.data || [])
          .filter(d => d.date_depense.startsWith(monthStr))
          .reduce((sum, d) => sum + Number(d.montant), 0);

        return { month, revenus: Math.round(revenus), depenses: Math.round(depenses), solde: Math.round(revenus - depenses) };
      });

      setMonthlyData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Rapport Comptable', 14, 15);
    doc.text(`Total Revenus: ${formatCurrency(stats.totalRevenus)}`, 14, 25);
    doc.text(`Total Depenses: ${formatCurrency(stats.totalDepenses)}`, 14, 32);
    doc.text(`Solde Net: ${formatCurrency(stats.soldeNet)}`, 14, 39);

    doc.autoTable({
      head: [['Mois', 'Revenus', 'Depenses', 'Solde']],
      body: monthlyData.map(m => [m.month, formatCurrency(m.revenus), formatCurrency(m.depenses), formatCurrency(m.solde)]),
      startY: 45,
    });

    doc.save('comptabilite.pdf');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-lg text-slate-600">Chargement...</div></div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Comptabilité</h1>
          <p className="text-slate-600">Gestion financière et bilans</p>
        </div>
        <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Revenus</h3>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(stats.totalRevenus)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Dépenses</h3>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(stats.totalDepenses)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Solde Net</h3>
          <p className={`text-3xl font-bold ${stats.soldeNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.soldeNet)}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Évolution mensuelle</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="revenus" fill="#10b981" name="Revenus" radius={[8, 8, 0, 0]} />
            <Bar dataKey="depenses" fill="#ef4444" name="Dépenses" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Détails mensuels</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Mois</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Revenus</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Dépenses</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Solde</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((item) => (
                <tr key={item.month} className="border-b border-slate-100">
                  <td className="py-4 px-4 text-sm text-slate-700">{item.month}</td>
                  <td className="py-4 px-4 text-sm text-green-600 text-right">{formatCurrency(item.revenus)}</td>
                  <td className="py-4 px-4 text-sm text-red-600 text-right">{formatCurrency(item.depenses)}</td>
                  <td className={`py-4 px-4 text-sm text-right font-semibold ${item.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(item.solde)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
