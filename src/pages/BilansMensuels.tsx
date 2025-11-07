{/*import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface BilanBailleur {
  bailleur_id: string;
  bailleur_nom: string;
  bailleur_prenom: string;
  immeubles: {
    immeuble_nom: string;
    loyers_percus: number;
    loyers_impayes: number;
    frais_gestion: number;
    resultat_net: number;
  }[];
  total_loyers_percus: number;
  total_impayes: number;
  total_frais: number;
  total_net: number;
}

export function BilansMensuels() {
  const [bilans, setBilans] = useState<BilanBailleur[]>([]);
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

      const { data: bailleurs } = await supabase
        .from('bailleurs')
        .select('id, nom, prenom')
        .eq('actif', true);

      const { data: immeubles } = await supabase
        .from('immeubles')
        .select('id, nom, bailleur_id')
        .eq('actif', true);

      const { data: paiements } = await supabase
        .from('paiements')
        .select(`
          montant_total,
          part_agence,
          part_bailleur,
          statut,
          contrats(
            unites(
              immeuble_id
            )
          )
        `)
        .gte('mois_concerne', monthStart)
        .lt('mois_concerne', monthEndStr);

      const bilansMap = new Map<string, BilanBailleur>();

      bailleurs?.forEach(bailleur => {
        const bailleursImmeubles = immeubles?.filter(i => i.bailleur_id === bailleur.id) || [];

        const immeublesData = bailleursImmeubles.map(immeuble => ({
          immeuble_nom: immeuble.nom,
          loyers_percus: 0,
          loyers_impayes: 0,
          frais_gestion: 0,
          resultat_net: 0,
        }));

        bilansMap.set(bailleur.id, {
          bailleur_id: bailleur.id,
          bailleur_nom: bailleur.nom,
          bailleur_prenom: bailleur.prenom,
          immeubles: immeublesData,
          total_loyers_percus: 0,
          total_impayes: 0,
          total_frais: 0,
          total_net: 0,
        });
      });

      paiements?.forEach(paiement => {
        const immeubleId = paiement.contrats?.unites?.immeuble_id;
        const immeuble = immeubles?.find(i => i.id === immeubleId);

        if (immeuble && bilansMap.has(immeuble.bailleur_id)) {
          const bilan = bilansMap.get(immeuble.bailleur_id)!;
          const immeubleData = bilan.immeubles.find(i => i.immeuble_nom === immeuble.nom);

          if (immeubleData) {
            if (paiement.statut === 'paye') {
              immeubleData.loyers_percus += Number(paiement.montant_total);
              immeubleData.frais_gestion += Number(paiement.part_agence);
              immeubleData.resultat_net += Number(paiement.part_bailleur);

              bilan.total_loyers_percus += Number(paiement.montant_total);
              bilan.total_frais += Number(paiement.part_agence);
              bilan.total_net += Number(paiement.part_bailleur);
            } else if (paiement.statut === 'impaye') {
              immeubleData.loyers_impayes += Number(paiement.montant_total);
              bilan.total_impayes += Number(paiement.montant_total);
            }
          }
        }
      });

      setBilans(Array.from(bilansMap.values()));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = (bilan: BilanBailleur) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('BILAN MENSUEL', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Bailleur: ${bilan.bailleur_prenom} ${bilan.bailleur_nom}`, 14, 35);
    doc.text(
      `Période: ${new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}`,
      14,
      42
    );

    doc.autoTable({
      head: [['Immeuble', 'Loyers perçus', 'Impayés', 'Frais gestion', 'Montant net']],
      body: bilan.immeubles.map(i => [
        i.immeuble_nom,
        formatCurrency(i.loyers_percus),
        formatCurrency(i.loyers_impayes),
        formatCurrency(i.frais_gestion),
        formatCurrency(i.resultat_net),
      ]),
      startY: 50,
      styles: { fontSize: 10 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAUX:', 14, finalY);
    doc.text(`Loyers perçus: ${formatCurrency(bilan.total_loyers_percus)}`, 14, finalY + 7);
    doc.text(`Loyers impayés: ${formatCurrency(bilan.total_impayes)}`, 14, finalY + 14);
    doc.text(`Frais de gestion: ${formatCurrency(bilan.total_frais)}`, 14, finalY + 21);
    doc.setFontSize(14);
    doc.text(`MONTANT À VERSER: ${formatCurrency(bilan.total_net)}`, 14, finalY + 30);

    doc.save(`bilan-${bilan.bailleur_nom}-${selectedMonth}.pdf`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bilans Mensuels</h1>
          <p className="text-slate-600">Rapports détaillés par bailleur et immeuble</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <label className="text-sm font-medium text-slate-700">Sélectionner la période</label>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full md:w-64 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-6">
        {bilans.map((bilan) => (
          <div key={bilan.bailleur_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {bilan.bailleur_prenom} {bilan.bailleur_nom}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {bilan.immeubles.length} immeuble(s) géré(s)
                </p>
              </div>
              
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Immeuble</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Loyers perçus</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Impayés</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Frais gestion</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Montant net</th>
                  </tr>
                </thead>
                <tbody>
                  {bilan.immeubles.map((immeuble, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-700">{immeuble.immeuble_nom}</td>
                      <td className="py-3 px-4 text-sm text-green-600 text-right font-medium">
                        {formatCurrency(immeuble.loyers_percus)}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600 text-right font-medium">
                        {formatCurrency(immeuble.loyers_impayes)}
                      </td>
                      <td className="py-3 px-4 text-sm text-blue-600 text-right font-medium">
                        {formatCurrency(immeuble.frais_gestion)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-right font-semibold">
                        {formatCurrency(immeuble.resultat_net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t-2 border-slate-200">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Total loyers perçus</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(bilan.total_loyers_percus)}</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700 font-medium">Total impayés</p>
                <p className="text-xl font-bold text-red-900">{formatCurrency(bilan.total_impayes)}</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Total frais gestion</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(bilan.total_frais)}</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-lg">
                <p className="text-sm text-slate-300 font-medium">Montant à verser</p>
                <p className="text-xl font-bold text-white">{formatCurrency(bilan.total_net)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
