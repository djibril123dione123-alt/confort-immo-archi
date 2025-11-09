import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { Plus, Search } from 'lucide-react';
import { generateMandatBailleurPDF } from '../lib/pdf';
import { useAuth } from '../contexts/AuthContext';

interface Bailleur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  adresse: string | null;
  piece_identite: string | null;
  notes: string | null;
  actif: boolean;
  created_at: string;
}

export function Bailleurs() {
  const { user } = useAuth();
  const [bailleurs, setBailleurs] = useState<Bailleur[]>([]);
  const [filteredBailleurs, setFilteredBailleurs] = useState<Bailleur[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBailleur, setEditingBailleur] = useState<Bailleur | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    piece_identite: '',
    notes: '',
  });

  useEffect(() => {
    loadBailleurs();
  }, []);

  useEffect(() => {
    const filtered = bailleurs.filter(b =>
      `${b.nom} ${b.prenom} ${b.telephone} ${b.email || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredBailleurs(filtered);
  }, [searchTerm, bailleurs]);

  const loadBailleurs = async () => {
    try {
      const { data, error } = await supabase
        .from('bailleurs')
        .select('*')
        .eq('actif', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBailleurs(data || []);
      setFilteredBailleurs(data || []);
    } catch (error) {
      console.error('Error loading bailleurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBailleur) {
        const { error } = await supabase
          .from('bailleurs')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingBailleur.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bailleurs')
          .insert([{ ...formData, created_by: user?.id }]);

        if (error) throw error;
      }

      closeModal();
      loadBailleurs();
    } catch (error) {
      console.error('Error saving bailleur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (bailleur: Bailleur) => {
    setEditingBailleur(bailleur);
    setFormData({
      nom: bailleur.nom,
      prenom: bailleur.prenom,
      telephone: bailleur.telephone,
      email: bailleur.email || '',
      adresse: bailleur.adresse || '',
      piece_identite: bailleur.piece_identite || '',
      notes: bailleur.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (bailleur: Bailleur) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bailleur ?')) return;

    try {
      const { error } = await supabase
        .from('bailleurs')
        .update({ actif: false })
        .eq('id', bailleur.id);

      if (error) throw error;
      loadBailleurs();
    } catch (error) {
      console.error('Error deleting bailleur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBailleur(null);
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      adresse: '',
      piece_identite: '',
      notes: '',
    });
  };

  const columns = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'email', label: 'Email', render: (b: Bailleur) => b.email || '-' },
    { key: 'adresse', label: 'Adresse', render: (b: Bailleur) => b.adresse || '-' },
    { key: 'mandat', label: 'Mandat', render: (b: Bailleur) => (
      <button
        onClick={() => generateMandatBailleurPDF(b)}
        className="px-1 py-1 text-sm font-medium text-white rounded-lg shadow-md 
             transition-all duration-300 transform hover:scale-105"
         style={{
    background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)',
  }}
      >
        Mandat PDF
      </button>
    ) },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-lg text-slate-600">Chargement...</div></div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bailleurs</h1>
          <p className="text-slate-600">Gestion des propriétaires</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nouveau bailleur
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un bailleur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredBailleurs}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBailleur ? 'Modifier le bailleur' : 'Nouveau bailleur'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom *</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prénom *</label>
              <input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone *</label>
              <input
                type="tel"
                required
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Adresse</label>
            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pièce d'identité</label>
            <input
              type="text"
              value={formData.piece_identite}
              onChange={(e) => setFormData({ ...formData, piece_identite: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {editingBailleur ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
