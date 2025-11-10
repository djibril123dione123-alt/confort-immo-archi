
// =========================
// 📄 Paiements.tsx
// =========================
// Page de gestion des paiements (ajout, modification, suppression, export PDF)
// Liée aux tables : paiements, contrats, locataires, unités, revenus
// =========================

// 🔹 Importations principales
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { Plus, Search, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { generatePaiementFacturePDF } from '../lib/pdf';

// Déclaration du module pour jsPDF autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// =========================
// 🔸 Début du composant principal
// =========================
export function Paiements() {
  // États de base
  const [paiements, setPaiements] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [contrats, setContrats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPaiement, setEditingPaiement] = useState<any | null>(null);

  // État du formulaire
  const initialFormData = {
    contrat_id: '',
    montant_total: '',
    mois_concerne: '',
    mois_display: '',
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'especes' as const,
    statut: 'paye' as const,
    reference: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  // =========================
  // 💰 Fonction de formatage des montants
  // =========================
  const formatCurrency = (amount: number | string): string => {
    if (!amount) return '0 F CFA';
    const cleaned = String(amount).replace(/\//g, '').replace(/\s/g, '');
    const num = Number(cleaned);
    return (
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
      })
        .format(num)
        .replace(/\u00A0/g, ' ') + ' F CFA'
    );
  };

  // =========================
  // 🔁 Chargement des données
  // =========================
  const loadData = async () => {
    try {
      const [paiementsRes, contratsRes] = await Promise.all([
        supabase
          .from('paiements')
          .select(
            '*, contrats(loyer_mensuel, pourcentage_agence, locataires(nom, prenom), unites(nom,id))'
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('contrats')
          .select(
            'id, loyer_mensuel, pourcentage_agence, locataires(nom, prenom), unites(nom)'
          )
          .eq('statut', 'actif'),
      ]);

      setPaiements(paiementsRes.data || []);
      setFiltered(paiementsRes.data || []);
      setContrats(contratsRes.data || []);
    } catch (error) {
      console.error('Erreur chargement données :', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  // Filtrage par recherche
  useEffect(() => {
    setFiltered(
      paiements.filter((p) =>
        JSON.stringify(p).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, paiements]);

  // =========================
  // 🗓️ Gestion du mois
  // =========================
  const handleMoisChange = (monthValue: string) => {
    setFormData({
      ...formData,
      mois_display: monthValue,
      mois_concerne: monthValue + '-01',
    });
  };

  // =========================
  // ✏️ Modification
  // =========================
  const handleEdit = (paiement: any) => {
    setEditingPaiement(paiement);
    setFormData({
      contrat_id: paiement.contrat_id,
      montant_total: paiement.montant_total.toString(),
      mois_display: paiement.mois_concerne.slice(0, 7),
      mois_concerne: paiement.mois_concerne,
      date_paiement: paiement.date_paiement,
      mode_paiement: paiement.mode_paiement,
      statut: paiement.statut,
      reference: paiement.reference || '',
    });
    setIsModalOpen(true);
  };

  // =========================
  // 💾 Enregistrement / Modification
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const contrat = contrats.find((c) => c.id === formData.contrat_id);
      if (!contrat) throw new Error('Contrat non trouvé');

      const montantTotal = parseFloat(formData.montant_total);
      const partAgence = (montantTotal * contrat.pourcentage_agence) / 100;
      const partBailleur = montantTotal - partAgence;

      const data = {
        montant_total: montantTotal,
        mois_concerne: formData.mois_concerne,
        date_paiement: formData.date_paiement,
        mode_paiement: formData.mode_paiement,
        statut: formData.statut,
        reference: formData.reference || null,
        part_agence: partAgence,
        part_bailleur: partBailleur,
      };

      let error;
      if (editingPaiement) {
        const result = await supabase
          .from('paiements')
          .update(data)
          .eq('id', editingPaiement.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('paiements')
          .insert([{ ...data, contrat_id: formData.contrat_id }]);
        error = result.error;
      }

      if (error) throw error;
      alert(editingPaiement ? '✅ Paiement modifié !' : '✅ Paiement ajouté !');
      setEditingPaiement(null);
      setIsModalOpen(false);
      setFormData(initialFormData);
      loadData();
    } catch (err: any) {
      console.error('Erreur :', err.message);
      alert(`Erreur : ${err.message}`);
    }
  };

  // =========================
  // ❌ Suppression d’un paiement
  // =========================
  const handleDelete = async (paiement: any) => {
    if (!confirm('Supprimer ce paiement ?')) return;
    try {
      const { error } = await supabase
        .from('paiements')
        .delete()
        .eq('id', paiement.id);
      if (error) throw error;

      if (paiement.statut === 'paye') {
        await supabase.from('revenus').delete().eq('paiement_id', paiement.id);
      }
      alert('✅ Paiement supprimé !');
      loadData();
    } catch (err: any) {
      console.error('Erreur suppression :', err.message);
      alert(`Erreur : ${err.message}`);
    }
  };

  // =========================
  // 🧾 Génération Facture PDF
  // =========================
  const exportFacture = async (paiementId: string) => {
    try {
      const { data: pmt, error: e1 } = await supabase
        .from('paiements')
        .select(
          'id, created_at, date_paiement, mois_concerne, montant_total, reference, contrats(id, loyer_mensuel, pourcentage_agence, locataires(nom, prenom), unites(id, nom))'
        )
        .eq('id', paiementId)
        .single();

      if (e1 || !pmt) throw new Error('Données incomplètes pour la facture.');

      let adresse = '—';
      try {
        const uniteId = pmt.contrats.unites.id;
        const { data: u } = await supabase
          .from('unites')
          .select('immeubles(adresse)')
          .eq('id', uniteId)
          .maybeSingle();
        if (u?.immeubles?.adresse) adresse = u.immeubles.adresse;
      } catch {
        console.warn('Adresse non trouvée.');
      }

      const payload = {
        ...pmt,
        contrats: {
          ...pmt.contrats,
          unites: {
            ...pmt.contrats.unites,
            immeubles: { adresse },
          },
        },
      };

      await generatePaiementFacturePDF(payload);
    } catch (err: any) {
      console.error('Erreur facture PDF :', err);
      alert(`Erreur génération PDF : ${err.message}`);
    }
  };

  // =========================
  // 📋 Colonnes du tableau
  // =========================
  const columns = [
    {
      key: 'locataire',
      label: 'Locataire',
      render: (p: any) =>
        p.contrats?.locataires
          ? `${p.contrats.locataires.prenom} ${p.contrats.locataires.nom}`
          : '-',
    },
    {
      key: 'unite',
      label: 'Produit',
      render: (p: any) => p.contrats?.unites?.nom || '-',
    },
    {
      key: 'mois_concerne',
      label: 'Mois',
      render: (p: any) =>
        new Date(p.mois_concerne).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
        }),
    },
    {
      key: 'montant_total',
      label: 'Montant',
      render: (p: any) => formatCurrency(p.montant_total),
    },
    { key: 'date_paiement', label: 'Date paiement' },
    {
      key: 'statut',
      label: 'Statut',
      render: (p: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            p.statut === 'paye'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {p.statut}
        </span>
      ),
    },
    {
      key: 'facture',
      label: 'Facture',
      render: (p: any) => (
        <button
          onClick={() => exportFacture(p.id)}
          className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
        >
          Facture PDF
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (p: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(p)}
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
          >
            Modifier
          </button>
          <button
            onClick={() => handleDelete(p)}
            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
          >
            Supprimer
          </button>
        </div>
      ),
    },
  ];

  // =========================
  // 🧩 Interface
  // =========================
  if (loading)
    return (
      <div className="p-8 text-center">
        <p className="text-xl font-semibold">Chargement...</p>
      </div>
    );

  return (
    <div className="p-8">
      {/* 🔹 En-tête */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Paiements</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} /> Nouveau paiement
          </button>
        </div>
      </header>

      {/* 🔍 Barre de recherche */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 🔹 Tableau principal */}
      <Table columns={columns} data={filtered} />

      {/* 🔹 Modal de création / modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPaiement(null);
          setFormData(initialFormData);
        }}
        title={editingPaiement ? 'Modifier le paiement' : 'Nouveau paiement'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection contrat */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contrat *
            </label>
            <select
              required
              value={formData.contrat_id}
              onChange={(e) =>
                setFormData({ ...formData, contrat_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner</option>
              {contrats.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.locataires?.prenom} {c.locataires?.nom} -{' '}
                  {c.unites?.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Montant *
            </label>
            <input
              type="number"
              required
              value={formData.montant_total}
              onChange={(e) =>
                setFormData({ ...formData, montant_total: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mois concerné */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mois concerné *
            </label>
            <input
              type="month"
              required
              value={formData.mois_display}
              onChange={(e) => handleMoisChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date paiement */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date de paiement
            </label>
            <input
              type="date"
              value={formData.date_paiement}
              onChange={(e) =>
                setFormData({ ...formData, date_paiement: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mode de paiement
            </label>
            <select
              value={formData.mode_paiement}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mode_paiement: e.target.value as 'especes' | 'virement',
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="especes">Espèces</option>
              <option value="virement">Virement</option>
            </select>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Statut
            </label>
            <select
              value={formData.statut}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  statut: e.target.value as 'paye' | 'en_attente',
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="paye">Payé</option>
              <option value="en_attente">En attente</option>
            </select>
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Référence
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Référence de transaction (optionnelle)"
            />
          </div>

          {/* Bouton sauvegarde */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="
```
