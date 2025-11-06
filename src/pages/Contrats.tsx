import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { Plus, Search, FileText, Download } from 'lucide-react';
import { generateContratPDF } from '../lib/pdf';

export function Contrats() {
  const [contrats, setContrats] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [locataires, setLocataires] = useState<any[]>([]);
  const [unites, setUnites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    locataire_id: '',
    unite_id: '',
    date_debut: '',
    date_fin: '',
    loyer_mensuel: '',
    caution: '',
    pourcentage_agence: '10',
    statut: 'actif' as const,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setFiltered(contrats.filter(c => JSON.stringify(c).toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, contrats]);

  const loadData = async () => {
    try {
      const [contratsRes, locatairesRes, unitesRes] = await Promise.all([
        supabase.from('contrats').select('*, locataires(nom, prenom, telephone, email, adresse_personnelle, piece_identite), unites(nom, loyer_base, immeubles(nom, adresse, bailleurs(nom, prenom, telephone, adresse)))').order('created_at', { ascending: false }),
        supabase.from('locataires').select('id, nom, prenom').eq('actif', true),
        supabase.from('unites').select('id, nom, loyer_base, statut, immeubles(nom)').eq('actif', true).eq('statut', 'libre'),
      ]);
      setContrats(contratsRes.data || []);
      setFiltered(contratsRes.data || []);
      setLocataires(locatairesRes.data || []);
      setUnites(unitesRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUniteChange = (uniteId: string) => {
    const unite = unites.find(u => u.id === uniteId);
    setFormData({
      ...formData,
      unite_id: uniteId,
      loyer_mensuel: unite ? unite.loyer_base.toString() : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: uniteCheck } = await supabase
        .from('unites')
        .select('statut')
        .eq('id', formData.unite_id)
        .single();

      if (uniteCheck && uniteCheck.statut === 'loue') {
        alert('Cette produit est déjà occupée. Veuillez sélectionner une autre produit.');
        return;
      }

      const data = {
        ...formData,
        loyer_mensuel: parseFloat(formData.loyer_mensuel),
        caution: formData.caution ? parseFloat(formData.caution) : null,
        pourcentage_agence: parseFloat(formData.pourcentage_agence),
      };

      const { error } = await supabase.from('contrats').insert([data]);

      if (error) throw error;

      await supabase.from('unites').update({ statut: 'loue' }).eq('id', formData.unite_id);

      closeModal();
      loadData();
      alert('Contrat créé avec succès!');
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la création du contrat');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        statut: formData.statut,
        date_fin: formData.date_fin || null,
      };

      await supabase.from('contrats').update(data).eq('id', editing.id);

      if (formData.statut === 'resilie' || formData.statut === 'expire') {
        await supabase.from('unites').update({ statut: 'libre' }).eq('id', editing.unite_id);
      }

      closeEditModal();
      loadData();
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur');
    }
  };

  const handleEdit = (contrat: any) => {
    setEditing(contrat);
    setFormData({
      locataire_id: contrat.locataire_id,
      unite_id: contrat.unite_id,
      date_debut: contrat.date_debut,
      date_fin: contrat.date_fin || '',
      loyer_mensuel: contrat.loyer_mensuel.toString(),
      caution: contrat.caution?.toString() || '',
      pourcentage_agence: contrat.pourcentage_agence.toString(),
      statut: contrat.statut,
    });
    setIsEditModalOpen(true);
  };

  const handleDownloadPDF = async (contratId: string) => {
    try {
      const { data: contrat, error } = await supabase
        .from('contrats')
        .select(`
          *,
          locataires(nom, prenom, telephone, email, adresse_personnelle, piece_identite),
          unites(
            nom,
            loyer_base,
            immeubles(
              nom,
              adresse,
              bailleurs(nom, prenom, telephone, adresse)
            )
          )
        `)
        .eq('id', contratId)
        .single();

      if (error) throw error;
      if (contrat) {
        await generateContratPDF(contrat);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ locataire_id: '', unite_id: '', date_debut: '', date_fin: '', loyer_mensuel: '', caution: '', pourcentage_agence: '10', statut: 'actif' });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditing(null);
    setFormData({ locataire_id: '', unite_id: '', date_debut: '', date_fin: '', loyer_mensuel: '', caution: '', pourcentage_agence: '10', statut: 'actif' });
  };

const formatCurrency = (amount: number | string): string => {
  if (!amount) return "0 F CFA";

  // Nettoyage des formats erronés ("/", espaces multiples, etc.)
  const cleaned = String(amount)
    .replace(/\//g, "") // retire tous les slashs
    .replace(/\s/g, ""); // retire les espaces parasites

  const num = Number(cleaned);

  return (
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 })
      .format(num)
      .replace(/\u00A0/g, " ") + " F CFA"
  );
};



  const columns = [
    { key: 'locataire', label: 'Locataire', render: (c: any) => c.locataires ? `${c.locataires.prenom} ${c.locataires.nom}` : '-' },
    { key: 'unite', label: 'produit', render: (c: any) => c.unites?.nom || '-' },
    { key: 'immeuble', label: 'Immeuble', render: (c: any) => c.unites?.immeubles?.nom || '-' },
    { key: 'date_debut', label: 'Début' },
    { key: 'loyer_mensuel', label: 'Loyer', render: (c: any) => formatCurrency(c.loyer_mensuel) },
    { key: 'statut', label: 'Statut', render: (c: any) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.statut === 'actif' ? 'bg-green-100 text-green-700' : c.statut === 'resilie' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{c.statut}</span> },
    { key: 'actions', label: 'PDF', render: (c: any) => (
      <button
        onClick={() => handleDownloadPDF(c.id)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
      >
        <Download className="w-4 h-4" />
        PDF
      </button>
    )},
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-lg text-slate-600">Chargement...</div></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Contrats</h1>
          <p className="text-slate-600">Gestion des contrats de location</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-5 h-5" />
          Nouveau contrat
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <Table columns={columns} data={filtered} onEdit={handleEdit} />
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Nouveau contrat">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Locataire *</label>
            <select required value={formData.locataire_id} onChange={(e) => setFormData({ ...formData, locataire_id: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner</option>
              {locataires.map((l) => (<option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">produit libre *</label>
            <select required value={formData.unite_id} onChange={(e) => handleUniteChange(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner une produit</option>
              {unites.map((u) => (<option key={u.id} value={u.id}>{u.nom} - {u.immeubles?.nom} ({formatCurrency(u.loyer_base)})</option>))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Seules les produits libres sont affichées</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date début *</label>
              <input type="date" required value={formData.date_debut} onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date fin</label>
              <input type="date" value={formData.date_fin} onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Loyer mensuel *</label>
              <input type="number" required value={formData.loyer_mensuel} onChange={(e) => setFormData({ ...formData, loyer_mensuel: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Caution</label>
              <input type="number" value={formData.caution} onChange={(e) => setFormData({ ...formData, caution: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Commission agence (%) *</label>
            <input type="number" required value={formData.pourcentage_agence} onChange={(e) => setFormData({ ...formData, pourcentage_agence: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={closeModal} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">Annuler</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Créer le contrat</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Modifier le contrat">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Statut *</label>
            <select required value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="actif">Actif</option>
              <option value="expire">Expiré</option>
              <option value="resilie">Résilié</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date de fin</label>
            <input type="date" value={formData.date_fin} onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> La résiliation ou l'expiration du contrat libérera automatiquement le produit.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={closeEditModal} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">Annuler</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Mettre à jour</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
