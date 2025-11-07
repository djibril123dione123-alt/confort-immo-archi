import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function BilanEntreprise() {
  const [bilan, setBilan] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadBilan();
  }, [selectedMonth]);

  const loadBilan = async () => {
    setLoading(true);
    try {
      const monthStart = `${selectedMonth}-01`;
      const monthEnd = new Date(selectedMonth + '-01');
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      const monthEndStr = monthEnd.toISOString().slice(0, 10);

      const [paiementsRes, depensesRes, revenus_autresRes] = await Promise.all([
        supabase
          .from('paiements')
          .select('*')
          .gte('mois_concerne', monthStart)
          .lt('mois_concerne', monthEndStr),
        supabase
          .from('depenses')
          .select('*')
          .gte('date_depense', monthStart)
          .lt('date_depense', monthEndStr),
        supabase
          .from('revenus')
          .select('*')
          .gte('date_revenu', monthStart)
          .lt('date_revenu', monthEndStr),
      ]);

      const paiements = paiementsRes.data || [];
      const depenses = depensesRes.data || [];
      const revenus_autres = revenus_autresRes.data || [];

      const totalLoyers = paiements.reduce((sum, p) => sum + Number(p.montant_total), 0);
      const loyersImpayes = paiements
        .filter(p => p.statut === 'impaye')
        .reduce((sum, p) => sum + Number(p.montant_total), 0);

      const commission = paiements
        .filter(p => p.statut === 'paye')
        .reduce((sum, p) => sum + Number(p.part_agence), 0);

      const revenus_alt = revenus_autres.reduce((sum, r) => sum + Number(r.montant), 0);
      const totalRevenus = commission + revenus_alt;
      const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant), 0);
      const soldeNet = totalRevenus - totalDepenses;

      setBilan({
        totalLoyers,
        loyersImpayes,
        commission,
        revenus_alt,
        totalRevenus,
        totalDepenses,
        soldeNet,
      });

      // Données annuelles
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const year = new Date(selectedMonth).getFullYear();
      const yearData = [];

      for (let i = 0; i < 12; i++) {
        const mStart = `${year}-${String(i + 1).padStart(2, '0')}-01`;
        const mEnd = new Date(mStart);
        mEnd.setMonth(mEnd.getMonth() + 1);
        const mEndStr = mEnd.toISOString().slice(0, 10);

        const { data: paiementsM } = await supabase
          .from('paiements')
          .select('*')
          .gte('mois_concerne', mStart)
          .lt('mois_concerne', mEndStr);

        const { data: depensesM } = await supabase
          .from('depenses')
          .select('*')
          .gte('date_depense', mStart)
          .lt('date_depense', mEndStr);

        const comm = (paiementsM || [])
          .filter(p => p.statut === 'paye')
          .reduce((sum, p) => sum + Number(p.part_agence), 0);

        const exp = (depensesM || []).reduce((sum, d) => sum + Number(d.montant), 0);

        yearData.push({
          month: months[i],
          commission: Math.round(comm),
          depenses: Math.round(exp),
          solde: Math.round(comm - exp),
        });
      }

      setMonthlyData(yearData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!bilan) return;
    const doc = new jsPDF();
    const monthName = new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });

    doc.setFontSize(20);
    doc.text('BILAN MENSUEL - ENTREPRISE', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Période: ${monthName}`, 14, 30);

    doc.autoTable({
      head: [['Élément', 'Montant']],
      body: [
        ['Total loyers perçus', formatCurrency(bilan.totalLoyers)],
        ['Loyers impayés', formatCurrency(bilan.loyersImpayes)],
        ['Commission agence', formatCurrency(bilan.commission)],
        ['Autres revenus', formatCurrency(bilan.revenus_alt)],
        ['Total revenus', formatCurrency(bilan.totalRevenus)],
        ['Total dépenses', formatCurrency(bilan.totalDepenses)],
        ['SOLDE NET', formatCurrency(bilan.soldeNet)],
      ],
      startY: 40,
    });

    doc.save(`bilan-entreprise-${selectedMonth}.pdf`);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);

  if (loading) return <div className="flex items-center justify-center h-full"><div>Chargement...</div></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bilan de l'Entreprise</h1>
          <p className="text-slate-600">Vue globale des finances</p>
        </div>
        <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">Période</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {bilan && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-600 text-white rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-blue-700 font-medium">Commission agence</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(bilan.commission)}</p>
            </div>

            <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-600 text-white rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-green-700 font-medium">Total revenus</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(bilan.totalRevenus)}</p>
            </div>

            <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-600 text-white rounded-lg">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-red-700 font-medium">Total dépenses</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(bilan.totalDepenses)}</p>
            </div>

            <div className={`${bilan.soldeNet >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'} p-6 rounded-2xl border`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 ${bilan.soldeNet >= 0 ? 'bg-emerald-600' : 'bg-orange-600'} text-white rounded-lg`}>
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className={`text-sm font-medium ${bilan.soldeNet >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>Solde net</p>
              <p className={`text-2xl font-bold ${bilan.soldeNet >= 0 ? 'text-emerald-900' : 'text-orange-900'}`}>{formatCurrency(bilan.soldeNet)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Résumé du mois</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b"><span className="text-slate-600">Total loyers</span><span className="font-semibold">{formatCurrency(bilan.totalLoyers)}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-slate-600">Impayés</span><span className="font-semibold text-red-600">{formatCurrency(bilan.loyersImpayes)}</span></div>
                <div className="flex justify-between py-2"><span className="text-slate-600">Autres revenus</span><span className="font-semibold text-green-600">{formatCurrency(bilan.revenus_alt)}</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tendance annuelle</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="commission" stroke="#3b82f6" name="Commission" />
                  <Line type="monotone" dataKey="depenses" stroke="#ef4444" name="Dépenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Détails mensuels</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="commission" fill="#3b82f6" name="Commission" />
                <Bar dataKey="depenses" fill="#ef4444" name="Dépenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}