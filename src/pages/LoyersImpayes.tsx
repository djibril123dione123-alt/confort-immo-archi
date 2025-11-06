import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Table } from '../components/ui/Table';
import { Search, AlertCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface LoyerImpaye {
  id: string;
  locataire_nom: string;
  locataire_prenom: string;
  unite_nom: string;
  immeuble_nom: string;
  bailleur_nom: string;
  bailleur_prenom: string;
  montant_du: number;
  mois_concerne: string;
  telephone_locataire: string;
}

export function LoyersImpayes() {
  const [impayes, setImpayes] = useState<LoyerImpaye[]>([]);
  const [filtered, setFiltered] = useState<LoyerImpaye[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBailleur, setSelectedBailleur] = useState('');
  const [bailleurs, setBailleurs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = impayes;

    if (searchTerm) {
      result = result.filter(i =>
        `${i.locataire_nom} ${i.locataire_prenom} ${i.unite_nom} ${i.immeuble_nom}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBailleur) {
      result = result.filter(i =>
        `${i.bailleur_prenom} ${i.bailleur_nom}` === selectedBailleur
      );
    }

    setFiltered(result);
  }, [searchTerm, selectedBailleur, impayes]);

  const loadData = async () => {
    try {
      const { data: contratsActifs } = await supabase
        .from('contrats')
        .select(`
          id,
          loyer_mensuel,
          locataires(nom, prenom, telephone),
          unites(
            nom,
            immeubles(
              nom,
              bailleurs(nom, prenom)
            )
          )
        `)
        .eq('statut', 'actif');

      const currentDate = new Date();
      const lastSixMonths = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        lastSixMonths.push(d.toISOString().slice(0, 7) + '-01');
      }

      const contratIds = contratsActifs?.map(c => c.id) || [];

      const { data: paiementsExistants } = await supabase
        .from('paiements')
        .select('contrat_id, mois_concerne, statut')
        .in('contrat_id', contratIds)
        .in('mois_concerne', lastSixMonths);

      const paiementsMap = new Map();
      paiementsExistants?.forEach(p => {
        const key = `${p.contrat_id}-${p.mois_concerne}`;
        paiementsMap.set(key, p.statut);
      });

      const impayesList: LoyerImpaye[] = [];

      contratsActifs?.forEach(contrat => {
        lastSixMonths.forEach(mois => {
          const key = `${contrat.id}-${mois}`;
          const statut = paiementsMap.get(key);

          if (!statut || statut === 'impaye') {
            impayesList.push({
              id: `${contrat.id}-${mois}`,
              locataire_nom: contrat.locataires?.nom || '',
              locataire_prenom: contrat.locataires?.prenom || '',
              unite_nom: contrat.unites?.nom || '',
              immeuble_nom: contrat.unites?.immeubles?.nom || '',
              bailleur_nom: contrat.unites?.immeubles?.bailleurs?.nom || '',
              bailleur_prenom: contrat.unites?.immeubles?.bailleurs?.prenom || '',
              montant_du: contrat.loyer_mensuel,
              mois_concerne: mois,
              telephone_locataire: contrat.locataires?.telephone || '',
            });
          }
        });
      });

      setImpayes(impayesList);
      setFiltered(impayesList);

      const uniqueBailleurs = Array.from(
        new Set(impayesList.map(i => `${i.bailleur_prenom} ${i.bailleur_nom}`))
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
    doc.text('Loyers Impayés', 14, 20);

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
    doc.text(`Total impayés: ${formatCurrency(filtered.reduce((sum, i) => sum + i.montant_du, 0))}`, 14, 34);

    doc.autoTable({
      head: [['Locataire', 'Produit', 'Immeuble', 'Bailleur', 'Mois', 'Montant', 'Téléphone']],
      body: filtered.map(i => [
        `${i.locataire_prenom} ${i.locataire_nom}`,
        i.unite_nom,
        i.immeuble_nom,
        `${i.bailleur_prenom} ${i.bailleur_nom}`,
        new Date(i.mois_concerne).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }),
        formatCurrency(i.montant_du),
        i.telephone_locataire,
      ]),
      startY: 40,
      styles: { fontSize: 8 },
    });

    doc.save('loyers-impayes.pdf');
  };

 const formatCurrency = (amount: number) => {
  if (!amount) return '0 F CFA';
  return (
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 })
      .format(amount)
      .replace(/\u00A0/g, ' ') + ' F CFA'
  );
};


  const totalImpaye = filtered.reduce((sum, i) => sum + i.montant_du, 0);

  const columns = [
    {
      key: 'locataire',
      label: 'Locataire',
      render: (i: LoyerImpaye) => `${i.locataire_prenom} ${i.locataire_nom}`,
    },
    { key: 'unite_nom', label: 'Produit' },
    { key: 'immeuble_nom', label: 'Immeuble' },
    {
      key: 'bailleur',
      label: 'Bailleur',
      render: (i: LoyerImpaye) => `${i.bailleur_prenom} ${i.bailleur_nom}`,
    },
    {
      key: 'mois_concerne',
      label: 'Mois',
      render: (i: LoyerImpaye) =>
        new Date(i.mois_concerne).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
        }),
    },
    {
      key: 'montant_du',
      label: 'Montant dû',
      render: (i: LoyerImpaye) => formatCurrency(i.montant_du),
    },
    { key: 'telephone_locataire', label: 'Téléphone' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Loyers Impayés</h1>
          <p className="text-slate-600">Suivi des loyers en retard</p>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600">Total impayés</h3>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalImpaye)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Nombre de loyers impayés</h3>
          <p className="text-2xl font-bold text-slate-900">{filtered.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Locataires concernés</h3>
          <p className="text-2xl font-bold text-slate-900">
            {new Set(filtered.map(i => `${i.locataire_nom} ${i.locataire_prenom}`)).size}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <select
              value={selectedBailleur}
              onChange={(e) => setSelectedBailleur(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <Table columns={columns} data={filtered} />
      </div>
    </div>
  );
}
