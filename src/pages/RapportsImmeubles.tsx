import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface RapportImmeuble {
  immeuble_id: string;
  immeuble_nom: string;
  bailleur_nom: string;
  bailleur_prenom: string;
  loyers_percus: number;
  loyers_impayes: number;
  frais_gestion: number;
  resultat_net: number;
  nombre_unites: number;
  unites_louees: number;
  taux_occupation: number;
}

export function RapportsImmeubles() {
  const [rapports, setRapports] = useState<RapportImmeuble[]>([]);
  const [selectedBailleur, setSelectedBailleur] = useState('');
  const [bailleurs, setBailleurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const monthStart = `${selectedMonth}-01`;
      const monthEnd = new Date(selectedMonth + '-01');
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      const monthEndStr = monthEnd.toISOString().slice(0, 10);

      const { data: immeubles } = await supabase
        .from('immeubles')
        .select(`
          id,
          nom,
          nombre_unites,
          bailleurs(nom, prenom)
        `)
        .eq('actif', true);

      const { data: unites } = await supabase
        .from('unites')
        .select('immeuble_id, statut')
        .eq('actif', true);

      const { data: paiements } = await supabase
        .from('paiements')
        .select(`
          montant_total,
          part_agence,
          statut,
          contrats(
            unites(
              immeuble_id
            )
          )
        `)
        .gte('mois_concerne', monthStart)
        .lt('mois_concerne', monthEndStr);

      const rapportsMap = new Map<string, RapportImmeuble>();

      immeubles?.forEach(immeuble => {
        const unitesImmeuble = unites?.filter(u => u.immeuble_id === immeuble.id) || [];
        const unitesLouees = unitesImmeuble.filter(u => u.statut === 'loue').length;

        rapportsMap.set(immeuble.id, {
          immeuble_id: immeuble.id,
          immeuble_nom: immeuble.nom,
          bailleur_nom: immeuble.bailleurs?.nom || '',
          bailleur_prenom: immeuble.bailleurs?.prenom || '',
          loyers_percus: 0,
          loyers_impayes: 0,
          frais_gestion: 0,
          resultat_net: 0,
          nombre_unites: unitesImmeuble.length,
          unites_louees: unitesLouees,
          taux_occupation: unitesImmeuble.length > 0 ? (unitesLouees / unitesImmeuble.length) * 100 : 0,
        });
      });

      paiements?.forEach(paiement => {
        const immeubleId = paiement.contrats?.unites?.immeuble_id;
        if (immeubleId && rapportsMap.has(immeubleId)) {
          const rapport = rapportsMap.get(immeubleId)!;

          if (paiement.statut === 'paye') {
            rapport.loyers_percus += Number(paiement.montant_total);
            rapport.frais_gestion += Number(paiement.part_agence);
          } else if (paiement.statut === 'impaye') {
            rapport.loyers_impayes += Number(paiement.montant_total);
          }
        }
      });

      rapportsMap.forEach(rapport => {
        rapport.resultat_net = rapport.loyers_percus - rapport.frais_gestion;
      });

      const rapportsList = Array.from(rapportsMap.values());
      setRapports(rapportsList);

      const uniqueBailleurs = Array.from(
        new Set(rapportsList.map(r => `${r.bailleur_prenom} ${r.bailleur_nom}`))
      ).filter(b => b.trim());
      setBailleurs(uniqueBailleurs.map(b => ({ label: b })));

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Rapports par Immeuble', 14, 20);
    doc.setFontSize(10);
    doc.text(`Période: ${new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}`, 14, 28);

    const data = filteredRapports.map(r => [
      r.immeuble_nom,
      `${r.bailleur_prenom} ${r.bailleur_nom}`,
      formatCurrency(r.loyers_percus),
      formatCurrency(r.loyers_impayes),
      formatCurrency(r.frais_gestion),
      formatCurrency(r.resultat_net),
    ]);

    doc.autoTable({
      head: [['Immeuble', 'Bailleur', 'Loyers perçus', 'Impayés', 'Frais', 'Résultat net']],
      body: data,
      startY: 35,
      styles: { fontSize: 8 },
    });

    doc.save('rapports-immeubles.pdf');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredRapports = selectedBailleur
    ? rapports.filter(r => `${r.bailleur_prenom} ${r.bailleur_nom}` === selectedBailleur)
    : rapports;

  const totaux = filteredRapports.reduce(
    (acc, r) => ({
      loyers_percus: acc.loyers_percus + r.loyers_percus,
      loyers_impayes: acc.loyers_impayes + r.loyers_impayes,
      frais_gestion: acc.frais_gestion + r.frais_gestion,
      resultat_net: acc.resultat_net + r.resultat_net,
    }),
    { loyers_percus: 0, loyers_impayes: 0, frais_gestion: 0, resultat_net: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Rapports par Immeuble</h1>
          <p className="text-slate-600">Analyse financière détaillée</p>
        </div>
        {/*<button
          onClick={exportPDF}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download className="w-5 h-5" />
          Export PDF
        </button>*/}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Période</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Bailleur</label>
          <select
            value={selectedBailleur}
            onChange={(e) => setSelectedBailleur(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les bailleurs</option>
            {bailleurs.map((b, index) => (
              <option key={index} value={b.label}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600">Loyers perçus</h3>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totaux.loyers_percus)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600">Loyers impayés</h3>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totaux.loyers_impayes)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600">Frais de gestion</h3>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totaux.frais_gestion)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600">Résultat net</h3>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totaux.resultat_net)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRapports.map((rapport) => (
          <div key={rapport.immeuble_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{rapport.immeuble_nom}</h3>
                <p className="text-sm text-slate-600">
                  Bailleur: {rapport.bailleur_prenom} {rapport.bailleur_nom}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Taux d'occupation</p>
                <p className="text-2xl font-bold text-blue-600">{rapport.taux_occupation.toFixed(1)}%</p>
                <p className="text-xs text-slate-500">
                  {rapport.unites_louees} / {rapport.nombre_unites} produits
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Loyers perçus</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(rapport.loyers_percus)}</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700 font-medium">Loyers impayés</p>
                <p className="text-lg font-bold text-red-900">{formatCurrency(rapport.loyers_impayes)}</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Frais de gestion</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(rapport.frais_gestion)}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700 font-medium">Résultat net bailleur</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(rapport.resultat_net)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
