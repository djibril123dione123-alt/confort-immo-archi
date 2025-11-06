import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { Plus, Search, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { generatePaiementFacturePDF } from '../lib/pdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function Paiements() {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [contrats, setContrats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    contrat_id: '',
    montant_total: '',
    mois_concerne: '',
    mois_display: '',
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'especes' as const,
    statut: 'paye' as const,
    reference: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setFiltered(
      paiements.filter((p) =>
        JSON.stringify(p).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, paiements]);

  const loadData = async () => {
    try {
      const [paiementsRes, contratsRes] = await Promise.all([
        supabase
          .from('paiements')
          .select(
            '*, contrats(loyer_mensuel, pourcentage_agence, locataires(nom, prenom), unites(nom))'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const contrat = contrats.find((c) => c.id === formData.contrat_id);
      if (!contrat) throw new Error('Contrat non trouvé');

      const montantTotal = parseFloat(formData.montant_total);
      const partAgence = (montantTotal * contrat.pourcentage_agence) / 100;
      const partBailleur = montantTotal - partAgence;

      // Conversion du mois au format YYYY-MM-DD (début du mois)
      const moisConcerne = new Date(formData.mois_display + '-01')
        .toISOString()
        .split('T')[0];

      const data = {
        contrat_id: formData.contrat_id,
        montant_total: montantTotal,
        mois_concerne: moisConcerne,
        date_paiement: formData.date_paiement,
        mode_paiement: formData.mode_paiement,
        statut: formData.statut,
        reference: formData.reference || null,
        part_agence: partAgence,
        part_bailleur: partBailleur,
      };

      const { error } = await supabase.from('paiements').insert([data]);
      if (error) throw error;

      alert('✅ Paiement enregistré avec succès !');
      closeModal();
      loadData();
    } catch (error: any) {
      console.error('Erreur enregistrement paiement :', error.message);
      alert(`Erreur : ${error.message}`);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      contrat_id: '',
      montant_total: '',
      mois_concerne: '',
      mois_display: '',
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'especes',
      statut: 'paye',
      reference: '',
    });
  };

  const handleMoisChange = (monthValue: string) => {
    // Exemple : "2025-02" => on stocke aussi pour affichage
    setFormData({
      ...formData,
      mois_display: monthValue,
      mois_concerne: monthValue + '-01',
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Liste des Paiements', 14, 15);
    doc.autoTable({
      head: [['Locataire', 'Montant', 'Date', 'Statut']],
      body: filtered.map((p) => [
        p.contrats?.locataires
          ? `${p.contrats.locataires.prenom} ${p.contrats.locataires.nom}`
          : '-',
        formatCurrency(p.montant_total),
        p.date_paiement,
        p.statut,
      ]),
      startY: 20,
    });
    doc.save('paiements.pdf');
  };

const exportFacture = async (paiementId: string) => {
  try {
    // 1) Paiement + liens essentiels (pas de relations profondes)
    const { data: pmt, error: e1 } = await supabase
      .from('paiements')
      .select(`
        id, created_at, date_paiement, mois_concerne, montant_total, reference,
        contrats(
          id, loyer_mensuel, pourcentage_agence,
          locataires(nom, prenom),
          unites(id, nom)
        )
      `)
      .eq('id', paiementId)
      .single();

    if (e1) throw new Error(`Chargement paiement: ${e1.message}`);
    if (!pmt) throw new Error('Paiement introuvable');
    if (!pmt.contrats) throw new Error('Facture indisponible: ce paiement n’a pas de contrat lié');
    if (!pmt.contrats.locataires) throw new Error('Facture indisponible: contrat sans locataire');
    if (!pmt.contrats.unites) throw new Error('Facture indisponible: contrat sans produit');

    // 2) Adresse du logement (séparée, tolérante RLS)
    let adresse = '—';
    try {
      const uniteId = pmt.contrats.unites.id;
      if (uniteId) {
        const { data: u, error: e2 } = await supabase
          .from('unites')
          .select('immeubles(adresse)')
          .eq('id', uniteId)
          .maybeSingle();
        if (!e2 && u?.immeubles?.adresse) adresse = u.immeubles.adresse;
      }
    } catch (e) {
      console.warn('Adresse non récupérée (fallback "—"):', e);
    }

    // 3) Payload pour le PDF (adresse injectée)
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
    console.error('Facture PDF:', err);
    alert(`Erreur lors de la génération de la facture PDF: ${err?.message || err}`);
  }
};

const formatCurrency = (amount: number | string): string => {
  if (!amount) return "0 F CFA";

  // Nettoyage des formats erronés (ex: 75/000, 250 /000 etc.)
  const cleaned = String(amount)
    .replace(/\//g, "") // retire les slashs
    .replace(/\s/g, ""); // retire les espaces parasites

  const num = Number(cleaned);

  return (
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 })
      .format(num)
      .replace(/\u00A0/g, " ") + " F CFA"
  );
};


  const columns = [
    {
      key: 'locataire',
      label: 'Locataire',
      render: (p: any) =>
        p.contrats?.locataires
          ? `${p.contrats.locataires.prenom} ${p.contrats.locataires.nom}`
          : '-',
    },
    { key: 'unite', label: 'Produit', render: (p: any) => p.contrats?.unites?.nom || '-' },
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
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Paiements</h1>
          <p className="text-slate-600">Gestion des paiements de loyers</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
          >
            <Download className="w-5 h-5" />
            Export PDF
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Nouveau paiement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <Table columns={[
          ...columns,
          { key: 'facture', label: 'Facture', render: (p: any) => (
            <button onClick={() => exportFacture(p.id)} className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition">
              Facture PDF
            </button>
          ) },
        ]} data={filtered} />
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Nouveau paiement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
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
              {contrats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.locataires?.prenom} {c.locataires?.nom} - {c.unites?.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date paiement *
              </label>
              <input
                type="date"
                required
                value={formData.date_paiement}
                onChange={(e) =>
                  setFormData({ ...formData, date_paiement: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mode *
              </label>
              <select
                value={formData.mode_paiement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mode_paiement: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
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
              Créer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
