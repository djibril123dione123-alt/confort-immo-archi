// TableauDeBordFinancierGlobal.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Supposons que le chemin soit correct
import { TrendingUp, TrendingDown, DollarSign, Download, Calendar, Building2, DollarSign as Dollar } from 'lucide-react'; // Imports d'icônes unifiés [1-4]
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Imports graphiques unifiés [1, 4]
import jsPDF from 'jspdf'; // Import PDF unifié [1-4]
import 'jspdf-autotable'; // Import PDF unifié [1-4]

// Déclaration de module unifiée pour jspdf-autotable [1-4]
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

// -------------------------------------------------------------------------
// 1. DÉFINITION DES TYPES ET INTERFACES UNIFIÉS
// -------------------------------------------------------------------------

// Interface pour le rapport bailleur (issu de BilansMensuels [2, 5])
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

// Interface pour le rapport immeuble (issu de RapportsImmeubles [3, 6])
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

// Interface pour les données mensuelles (utilisée pour BilanEntreprise et Comptabilité [7, 8])
interface MonthlyStat {
    month: string;
    commission?: number; // BilanEntreprise
    revenus?: number; // Comptabilite
    depenses: number;
    solde: number;
}

// -------------------------------------------------------------------------
// 2. FONCTIONS UTILITAIRES UNIFIÉES
// -------------------------------------------------------------------------

// Fonction de formatage monétaire unique [9-12]
const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);


export function TableauDeBordFinancierGlobal() {
    // -------------------------------------------------------------------------
    // 3. ÉTATS CENTRALISÉS
    // -------------------------------------------------------------------------

    const [loading, setLoading] = useState(true); // État de chargement unique [5, 6, 8, 13]
    
    // État de la période sélectionnée, utilisé pour tous les rapports mensuels [5, 6, 13]
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    // Filtre spécifique aux rapports immeubles [6]
    const [selectedBailleur, setSelectedBailleur] = useState('');
    const [bailleursFilterList, setBailleursFilterList] = useState<{ label: string }[]>([]); // Liste des bailleurs pour le filtre [14]

    // Données des 4 rapports fusionnés:
    const [bilanEntreprise, setBilanEntreprise] = useState<any>(null); // Bilan mensuel de l'agence [13]
    const [statsAnnuel, setStatsAnnuel] = useState({ totalRevenus: 0, totalDepenses: 0, soldeNet: 0 }); // Totaux annuels [8]
    const [monthlyData, setMonthlyData] = useState<MonthlyStat[]>([]); // Données d'évolution annuelle [8, 13]
    const [rapportsImmeubles, setRapportsImmeubles] = useState<RapportImmeuble[]>([]); // Rapports par immeuble [6]
    const [bilansBailleurs, setBilansBailleurs] = useState<BilanBailleur[]>([]); // Bilans mensuels par bailleur [5]
    const [currentPage, setCurrentPage] = useState('bilan-entreprise'); // État de navigation simulé

    // -------------------------------------------------------------------------
    // 4. LOGIQUE DE CHARGEMENT ET DE CALCUL UNIFIÉE
    // -------------------------------------------------------------------------

    useEffect(() => {
        loadAllData();
    }, [selectedMonth]); // Déclenchement au changement de mois

    const loadAllData = async () => {
        setLoading(true);

        try {
            const currentYear = new Date(selectedMonth).getFullYear();
            const yearStartDate = `${currentYear}-01-01`;
            
            // --- Périodes mensuelles [13, 15, 16]
            const monthStart = `${selectedMonth}-01`;
            const monthEnd = new Date(selectedMonth + '-01');
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            const monthEndStr = monthEnd.toISOString().slice(0, 10);
            
            // --- Requêtes Supabase Centrales (Optimisation par Promise.all) ---
            const [
                paiementsMensuelsRes, 
                depensesMensuelsRes, 
                revenusAutresMensuelsRes,
                
                // Pour Rapports Annuels et Comptabilité:
                paiementsAnnuelsRes, 
                depensesAnnuelsRes, 

                // Pour Rapports Immeubles/Bailleurs:
                bailleursRes, 
                immeublesRes, 
                unitesRes 
            ] = await Promise.all([
                // 1. Données Mensuelles (pour Bilan Agence / Immeubles / Bailleurs) [17-19]
                supabase.from('paiements').select('*, contrats(unites(immeuble_id))').gte('mois_concerne', monthStart).lt('mois_concerne', monthEndStr),
                supabase.from('depenses').select('*').gte('date_depense', monthStart).lt('date_depense', monthEndStr),
                supabase.from('revenus').select('*').gte('date_revenu', monthStart).lt('date_revenu', monthEndStr),
                
                // 2. Données Annuelles (pour Tendance / Comptabilité) [20, 21]
                supabase.from('paiements').select('part_agence, mois_concerne, statut').gte('mois_concerne', yearStartDate),
                supabase.from('depenses').select('montant, date_depense').gte('date_depense', yearStartDate),

                // 3. Données Structurelles (pour Rapports Immeubles / Bailleurs) [15, 16]
                supabase.from('bailleurs').select('id, nom, prenom').eq('actif', true),
                supabase.from('immeubles').select('id, nom, bailleur_id, nombre_unites, bailleurs(nom, prenom)').eq('actif', true),
                supabase.from('unites').select('immeuble_id, statut').eq('actif', true),
            ]);

            // Extraction des données
            const paiementsMensuels = paiementsMensuelsRes.data || [];
            const depensesMensuels = depensesMensuelsRes.data || [];
            const revenus_autresMensuels = revenusAutresMensuelsRes.data || [];

            const paiementsAnnuels = paiementsAnnuelsRes.data || [];
            const depensesAnnuelles = depensesAnnuelsRes.data || [];

            const bailleurs = bailleursRes.data || [];
            const immeubles = immeublesRes.data || [];
            const unites = unitesRes.data || [];


            // ---------------------------------------------------
            // CALCUL 1: BILAN ENTREPRISE MENSUEL (KPIs) [7, 22]
            // ---------------------------------------------------
            const totalLoyers = paiementsMensuels.reduce((sum, p) => sum + Number(p.montant_total), 0);
            const loyersImpayes = paiementsMensuels
                .filter(p => p.statut === 'impaye')
                .reduce((sum, p) => sum + Number(p.montant_total), 0);
            const commission = paiementsMensuels
                .filter(p => p.statut === 'paye')
                .reduce((sum, p) => sum + Number(p.part_agence), 0);
            const revenus_alt = revenus_autresMensuels.reduce((sum, r) => sum + Number(r.montant), 0);

            const totalRevenus = commission + revenus_alt;
            const totalDepenses = depensesMensuels.reduce((sum, d) => sum + Number(d.montant), 0);
            const soldeNet = totalRevenus - totalDepenses;

            setBilanEntreprise({ totalLoyers, loyersImpayes, commission, revenus_alt, totalRevenus, totalDepenses, soldeNet });

            
            // ---------------------------------------------------
            // CALCUL 2: TENDANCE ANNUELLE / COMPTABILITÉ [20, 21, 23, 24]
            // ---------------------------------------------------
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            
            // Totaux Annuels [21]
            const totalRevenusAnnuel = (paiementsAnnuels || []).reduce((sum, p) => sum + Number(p.part_agence), 0);
            // NOTE: La comptabilité (source [21]) utilise les paiements payés (part_agence) pour les "revenus", correspondant à la "commission" du bilan.
            const totalDepensesAnnuel = (depensesAnnuelles || []).reduce((sum, d) => sum + Number(d.montant), 0);
            
            setStatsAnnuel({
                totalRevenus: totalRevenusAnnuel,
                totalDepenses: totalDepensesAnnuel,
                soldeNet: totalRevenusAnnuel - totalDepensesAnnuel,
            });

            // Données Mensuelles pour graphique (Comptabilité/Bilan Annuel)
            const yearData: MonthlyStat[] = months.map((monthName, index) => {
                const monthStr = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
                
                // Calcul des revenus (commission) et dépenses pour ce mois de l'année [24]
                const revenus = (paiementsAnnuels || [])
                    .filter(p => p.mois_concerne.startsWith(monthStr) && p.statut === 'paye')
                    .reduce((sum, p) => sum + Number(p.part_agence), 0);
                
                const depenses = (depensesAnnuelles || [])
                    .filter(d => d.date_depense.startsWith(monthStr))
                    .reduce((sum, d) => sum + Number(d.montant), 0);
                
                return { 
                    month: monthName, 
                    revenus: Math.round(revenus), // Utilisé dans la vue Comptabilité [24]
                    commission: Math.round(revenus), // Utilisé dans la vue Bilan Entreprise [23]
                    depenses: Math.round(depenses), 
                    solde: Math.round(revenus - depenses) 
                };
            });
            setMonthlyData(yearData);


            // ---------------------------------------------------
            // CALCUL 3: RAPPORTS IMMMEUBLES ET BILANS BAILLEURS (Fusionnés) [18, 19, 25-29]
            // ---------------------------------------------------
            
            const rapportsMap = new Map<string, RapportImmeuble>();
            const bilansMap = new Map<string, BilanBailleur>();

            // Initialisation des bilans bailleurs et rapports immeubles
            immeubles.forEach((immeuble: any) => { // Type any car structure "immeubles(nom, prenom)" non typée

                // Rôles pour le calcul du taux d'occupation [19, 28]
                const unitesImmeuble = unites?.filter((u: any) => u.immeuble_id === immeuble.id) || [];
                const unitesLouees = unitesImmeuble.filter((u: any) => u.statut === 'loue').length;
                
                // Initialisation Rapport Immeuble
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

                // Initialisation Bilan Bailleur (s'il n'existe pas déjà) [18, 25]
                const bailleurId = immeuble.bailleur_id;
                if (bailleurId && !bilansMap.has(bailleurId)) {
                    const bailleur = bailleurs.find((b: any) => b.id === bailleurId);
                    if (bailleur) {
                         bilansMap.set(bailleurId, {
                            bailleur_id: bailleurId,
                            bailleur_nom: bailleur.nom,
                            bailleur_prenom: bailleur.prenom,
                            immeubles: [],
                            total_loyers_percus: 0,
                            total_impayes: 0,
                            total_frais: 0,
                            total_net: 0,
                        });
                    }
                }
            });

            // Remplissage des rapports à partir des paiements mensuels [25, 26, 28, 29]
            paiementsMensuels.forEach((paiement: any) => {
                const immeubleId = paiement.contrats?.unites?.immeuble_id;
                const immeuble = immeubles?.find((i: any) => i.id === immeubleId);
                
                if (immeuble) {
                    const bailleurId = immeuble.bailleur_id;
                    const rapportImmeuble = rapportsMap.get(immeubleId)!;
                    const bilanBailleur = bilansMap.get(bailleurId);

                    if (paiement.statut === 'paye') {
                        // Mise à jour Rapport Immeuble [29]
                        rapportImmeuble.loyers_percus += Number(paiement.montant_total);
                        rapportImmeuble.frais_gestion += Number(paiement.part_agence);

                        // Mise à jour Bilan Bailleur [26]
                        if (bilanBailleur) {
                            const immeubleData = bilanBailleur.immeubles.find(i => i.immeuble_nom === immeuble.nom);
                            if (immeubleData) {
                                immeubleData.loyers_percus += Number(paiement.montant_total);
                                immeubleData.frais_gestion += Number(paiement.part_agence);
                                immeubleData.resultat_net += Number(paiement.part_bailleur);
                            } else {
                                // Ajouter l'immeuble si c'est la première transaction payée [25]
                                bilanBailleur.immeubles.push({
                                    immeuble_nom: immeuble.nom,
                                    loyers_percus: Number(paiement.montant_total),
                                    loyers_impayes: 0,
                                    frais_gestion: Number(paiement.part_agence),
                                    resultat_net: Number(paiement.part_bailleur),
                                });
                            }
                            bilanBailleur.total_loyers_percus += Number(paiement.montant_total);
                            bilanBailleur.total_frais += Number(paiement.part_agence);
                            bilanBailleur.total_net += Number(paiement.part_bailleur);
                        }
                    } else if (paiement.statut === 'impaye') {
                        // Mise à jour Rapport Immeuble [29]
                        rapportImmeuble.loyers_impayes += Number(paiement.montant_total);

                        // Mise à jour Bilan Bailleur [26, 27]
                         if (bilanBailleur) {
                            const immeubleData = bilanBailleur.immeubles.find(i => i.immeuble_nom === immeuble.nom);
                            if (immeubleData) {
                                immeubleData.loyers_impayes += Number(paiement.montant_total);
                            } else {
                                // Ajouter l'immeuble si c'est la première transaction impayée
                                bilanBailleur.immeubles.push({
                                    immeuble_nom: immeuble.nom,
                                    loyers_percus: 0,
                                    loyers_impayes: Number(paiement.montant_total),
                                    frais_gestion: 0,
                                    resultat_net: 0,
                                });
                            }
                            bilanBailleur.total_impayes += Number(paiement.montant_total);
                        }
                    }
                }
            });
            
            // Finalisation des rapports immeubles (calcul résultat net) [29]
            rapportsMap.forEach(rapport => {
                rapport.resultat_net = rapport.loyers_percus - rapport.frais_gestion;
            });
            
            const rapportsList = Array.from(rapportsMap.values());
            setRapportsImmeubles(rapportsList);

            // Finalisation des bilans bailleurs
            setBilansBailleurs(Array.from(bilansMap.values()));
            
            // Préparation de la liste des bailleurs pour le filtre Immeubles [14]
             const uniqueBailleurs = Array.from(
                new Set(rapportsList.map(r => `${r.bailleur_prenom} ${r.bailleur_nom}`))
            ).filter(b => b.trim());
            setBailleursFilterList(uniqueBailleurs.map(b => ({ label: b })));


        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // -------------------------------------------------------------------------
    // 5. FONCTIONS D'EXPORT PDF (Adaptées pour être appelées des sections)
    // -------------------------------------------------------------------------

    const exportBilanEntreprisePDF = () => {
        if (!bilanEntreprise) return;
        const doc = new jsPDF();
        const monthName = new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
        
        doc.setFontSize(20); [30]
        doc.text('BILAN MENSUEL - ENTREPRISE', 105, 15, { align: 'center' }); [30]
        doc.setFontSize(12); [30]
        doc.text(`Période: ${monthName}`, 14, 30); [30]

        doc.autoTable({
            head: [['Élément', 'Montant']],
            body: [
                ['Total loyers perçus', formatCurrency(bilanEntreprise.totalLoyers)], [30]
                ['Loyers impayés', formatCurrency(bilanEntreprise.loyersImpayes)], [30]
                ['Commission agence', formatCurrency(bilanEntreprise.commission)], [30]
                ['Autres revenus', formatCurrency(bilanEntreprise.revenus_alt)], [30]
                ['Total revenus', formatCurrency(bilanEntreprise.totalRevenus)], [30]
                ['Total dépenses', formatCurrency(bilanEntreprise.totalDepenses)], [30]
                ['SOLDE NET', formatCurrency(bilanEntreprise.soldeNet)], [9]
            ],
            startY: 40,
        });
        doc.save(`bilan-entreprise-${selectedMonth}.pdf`); [9]
    };

    const exportBilanBailleurPDF = (bilan: BilanBailleur) => {
        const doc = new jsPDF(); [27]
        doc.setFontSize(20); [27]
        doc.text('BILAN MENSUEL', 105, 20, { align: 'center' }); [27]
        doc.setFontSize(12); [27]
        doc.text(`Bailleur: ${bilan.bailleur_prenom} ${bilan.bailleur_nom}`, 14, 35); [27]
        doc.text(
            `Période: ${new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}`,
            14,
            42
        ); [31]

        doc.autoTable({
            head: [['Immeuble', 'Loyers perçus', 'Impayés', 'Frais gestion', 'Montant net']], [31]
            body: bilan.immeubles.map(i => [
                i.immeuble_nom,
                formatCurrency(i.loyers_percus),
                formatCurrency(i.loyers_impayes),
                formatCurrency(i.frais_gestion),
                formatCurrency(i.resultat_net),
            ]), [31]
            startY: 50, [31]
            styles: { fontSize: 10 }, [31]
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12); [31]
        doc.setFont(undefined, 'bold'); [31]
        doc.text('TOTAUX:', 14, finalY); [31]
        doc.text(`Loyers perçus: ${formatCurrency(bilan.total_loyers_percus)}`, 14, finalY + 7); [31]
        doc.text(`Loyers impayés: ${formatCurrency(bilan.total_impayes)}`, 14, finalY + 14); [10]
        doc.text(`Frais de gestion: ${formatCurrency(bilan.total_frais)}`, 14, finalY + 21); [10]
        doc.setFontSize(14); [10]
        doc.text(`MONTANT À VERSER: ${formatCurrency(bilan.total_net)}`, 14, finalY + 30); [10]
        doc.save(`bilan-${bilan.bailleur_nom}-${selectedMonth}.pdf`); [10]
    };

    const exportRapportsImmeublesPDF = () => {
        const filteredRapports = getFilteredRapports();
        const doc = new jsPDF(); [14]
        doc.setFontSize(18); [14]
        doc.text('Rapports par Immeuble', 14, 20); [14]
        doc.setFontSize(10); [14]
        doc.text(`Période: ${new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}`, 14, 28); [32]

        const data = filteredRapports.map(r => [
            r.immeuble_nom,
            `${r.bailleur_prenom} ${r.bailleur_nom}`,
            formatCurrency(r.loyers_percus),
            formatCurrency(r.loyers_impayes),
            formatCurrency(r.frais_gestion),
            formatCurrency(r.resultat_net),
        ]); [32]

        doc.autoTable({
            head: [['Immeuble', 'Bailleur', 'Loyers perçus', 'Impayés', 'Frais', 'Résultat net']], [32]
            body: data, [32]
            startY: 35, [32]
            styles: { fontSize: 8 }, [32]
        });

        doc.save('rapports-immeubles.pdf'); [32]
    };
    
    const exportComptabilitePDF = () => {
        const doc = new jsPDF(); [33]
        doc.text('Rapport Comptable', 14, 15); [33]
        doc.text(`Total Revenus: ${formatCurrency(statsAnnuel.totalRevenus)}`, 14, 25); [33]
        doc.text(`Total Depenses: ${formatCurrency(statsAnnuel.totalDepenses)}`, 14, 32); [33]
        doc.text(`Solde Net: ${formatCurrency(statsAnnuel.soldeNet)}`, 14, 39); [33]
        
        doc.autoTable({
            head: [['Mois', 'Revenus', 'Depenses', 'Solde']], [33]
            body: monthlyData.map(m => [
                m.month, 
                formatCurrency(m.revenus || 0), // Utilise la clé 'revenus' de Comptabilite [24]
                formatCurrency(m.depenses), 
                formatCurrency(m.solde)
            ]), [33]
            startY: 45, [12]
        });
        doc.save('comptabilite.pdf'); [12]
    };

    // -------------------------------------------------------------------------
    // 6. LOGIQUE DE FILTRAGE ET DE CALCUL D'AGRÉGATS (Rapports Immeubles)
    // -------------------------------------------------------------------------

    // Filtre des rapports immeubles [11]
    const getFilteredRapports = (): RapportImmeuble[] => {
        return selectedBailleur
            ? rapportsImmeubles.filter(r => `${r.bailleur_prenom} ${r.bailleur_nom}` === selectedBailleur)
            : rapportsImmeubles;
    };
    
    // Calcul des totaux pour les rapports immeubles filtrés [11, 34]
    const filteredRapports = getFilteredRapports();
    const totauxImmeubles = filteredRapports.reduce(
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
            <div className="p-8 text-center text-xl font-semibold">
                Chargement...
            </div>
        ); [9, 12, 34, 35]
    }
    
    // -------------------------------------------------------------------------
    // 7. RENDU DE L'INTERFACE UTILISATEUR CENTRALISÉE
    // -------------------------------------------------------------------------

    return (
        <div className="p-8 space-y-10">
            <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord Financier Global 📊</h1>

            {/* BARRE DE NAVIGATION (Simulée) */}
            <div className="flex space-x-4 border-b pb-2">
                <button 
                    onClick={() => setCurrentPage('bilan-entreprise')} 
                    className={`px-4 py-2 rounded-lg transition ${currentPage === 'bilan-entreprise' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Bilan Agence (Mensuel)
                </button>
                <button 
                    onClick={() => setCurrentPage('comptabilite')} 
                    className={`px-4 py-2 rounded-lg transition ${currentPage === 'comptabilite' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Comptabilité (Annuelle)
                </button>
                <button 
                    onClick={() => setCurrentPage('rapports-immeubles')} 
                    className={`px-4 py-2 rounded-lg transition ${currentPage === 'rapports-immeubles' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Rapports Immeubles
                </button>
                <button 
                    onClick={() => setCurrentPage('bilans-bailleurs')} 
                    className={`px-4 py-2 rounded-lg transition ${currentPage === 'bilans-bailleurs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Bilans Bailleurs
                </button>
            </div>
            
            {/* SÉLECTEUR DE PÉRIODE (Unique pour les rapports Mensuels) */}
            {(currentPage !== 'comptabilite') && (
                <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <label htmlFor="month-selector" className="text-gray-700 font-medium">Période:</label>
                    <input
                        id="month-selector"
                        type="month"
                        value={selectedMonth} [9, 34, 35]
                        onChange={(e) => setSelectedMonth(e.target.value)} [9, 34, 35]
                        className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" [9, 34, 35]
                    />
                </div>
            )}
            
            {/* VUE 1: BILAN ENTREPRISE (Mensuel) [9, 36, 37] */}
            {currentPage === 'bilan-entreprise' && bilanEntreprise && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold text-gray-700">Bilan de l'Entreprise (Mois de {new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })})</h2>
                        <button 
                            onClick={exportBilanEntreprisePDF}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            <Download className="w-5 h-5" /> Export PDF
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Carte 1: Commission agence */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
                            <p className="text-sm font-medium text-gray-500">Commission agence</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(bilanEntreprise.commission)}</p> [36]
                        </div>

                        {/* Carte 2: Total revenus */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
                            <p className="text-sm font-medium text-gray-500">Total revenus</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(bilanEntreprise.totalRevenus)}</p> [36]
                        </div>

                        {/* Carte 3: Total dépenses */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
                            <p className="text-sm font-medium text-gray-500">Total dépenses</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(bilanEntreprise.totalDepenses)}</p> [36]
                        </div>

                        {/* Carte 4: Solde Net (Dynamique) [36] */}
                        <div className={bilanEntreprise.soldeNet >= 0 ? 'bg-emerald-50 border-emerald-200 p-6 rounded-2xl border' : 'bg-orange-50 border-orange-200 p-6 rounded-2xl border'}>
                            <div className={bilanEntreprise.soldeNet >= 0 ? 'bg-emerald-600 text-white rounded-lg p-2 flex items-center justify-center w-10 h-10' : 'bg-orange-600 text-white rounded-lg p-2 flex items-center justify-center w-10 h-10'}>
                                {bilanEntreprise.soldeNet >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                            </div>
                            <p className={bilanEntreprise.soldeNet >= 0 ? 'text-emerald-700 text-sm font-medium mt-3' : 'text-orange-700 text-sm font-medium mt-3'}>Solde net</p>
                            <p className={bilanEntreprise.soldeNet >= 0 ? 'text-emerald-900 text-3xl font-extrabold mt-1' : 'text-orange-900 text-3xl font-extrabold mt-1'}>{formatCurrency(bilanEntreprise.soldeNet)}</p>
                        </div>
                    </div>
                    
                    {/* Résumé du mois [37] */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Résumé du mois</h3>
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <p className="text-gray-600">Total loyers <span className="block font-bold text-lg text-blue-500">{formatCurrency(bilanEntreprise.totalLoyers)}</span></p>
                            <p className="text-gray-600">Impayés <span className="block font-bold text-lg text-red-500">{formatCurrency(bilanEntreprise.loyersImpayes)}</span></p>
                            <p className="text-gray-600">Autres revenus <span className="block font-bold text-lg text-green-500">{formatCurrency(bilanEntreprise.revenus_alt)}</span></p>
                        </div>
                    </div>

                    {/* Tendance annuelle (Basé sur la commission) [37] */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Tendance annuelle (Commission vs Dépenses)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Montant']} />
                                <Legend />
                                <Line type="monotone" dataKey="commission" stroke="#8884d8" name="Commission" />
                                <Line type="monotone" dataKey="depenses" stroke="#82ca9d" name="Dépenses" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            
            {/* VUE 2: COMPTABILITÉ (Annuelle) [12, 38] */}
            {currentPage === 'comptabilite' && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold text-gray-700">Comptabilité (Année {new Date().getFullYear()})</h2>
                         <button 
                            onClick={exportComptabilitePDF}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            <Download className="w-5 h-5" /> Export PDF
                        </button>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Revenus (Commission annuelle) [12] */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
                            <p className="text-sm font-medium text-gray-500">Total Revenus</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(statsAnnuel.totalRevenus)}</p>
                        </div>

                        {/* Total Dépenses (Annuel) [12] */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
                            <p className="text-sm font-medium text-gray-500">Total Dépenses</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(statsAnnuel.totalDepenses)}</p>
                        </div>

                        {/* Solde Net (Annuel) [38] */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
                            <p className="text-sm font-medium text-gray-500">Solde Net</p>
                             <p className={`text-2xl font-bold mt-1 ${statsAnnuel.soldeNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(statsAnnuel.soldeNet)}
                            </p>
                        </div>
                    </div>

                    {/* Évolution mensuelle (Bar Chart) [38] */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Évolution mensuelle</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Montant']} />
                                <Legend />
                                <Bar dataKey="revenus" fill="#8884d8" name="Revenus (Commission)" />
                                <Bar dataKey="depenses" fill="#82ca9d" name="Dépenses" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* Détails mensuels (Tableau) [38] */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Détails mensuels</h3>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenus</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dépenses</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solde</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {monthlyData.map((item) => (
                                    <tr key={item.month}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.month}</td> [38]
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.revenus || 0)}</td> [38]
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.depenses)}</td> [38]
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(item.solde)}</td> [38]
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* VUE 3: RAPPORTS PAR IMMEUBLE [34, 39, 40] */}
            {currentPage === 'rapports-immeubles' && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold text-gray-700">Rapports par Immeuble (Mois de {new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })})</h2>
                        <button 
                            onClick={exportRapportsImmeublesPDF}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            <Download className="w-5 h-5" /> Export PDF
                        </button>
                    </div>

                    {/* Filtre Bailleur [34, 39] */}
                    <div className="flex items-center gap-4">
                        <label htmlFor="bailleur-filter" className="text-gray-700 font-medium">Bailleur:</label>
                        <select
                            id="bailleur-filter"
                            value={selectedBailleur} [39]
                            onChange={(e) => setSelectedBailleur(e.target.value)} [39]
                            className="w-full md:w-64 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" [39]
                        >
                            <option value="">Tous les bailleurs</option> [39]
                            {bailleursFilterList.map((b, index) => (
                                <option key={index} value={b.label}>{b.label}</option> [39]
                            ))}
                        </select>
                    </div>
                    
                    {/* Totaux Filtrés [39] */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl border shadow-md">
                            <p className="text-sm font-medium text-gray-500">Loyers perçus</p>
                            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totauxImmeubles.loyers_percus)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border shadow-md">
                            <p className="text-sm font-medium text-gray-500">Loyers impayés</p>
                            <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totauxImmeubles.loyers_impayes)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border shadow-md">
                            <p className="text-sm font-medium text-gray-500">Frais de gestion</p>
                            <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totauxImmeubles.frais_gestion)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border shadow-md">
                            <p className="text-sm font-medium text-gray-500">Résultat net</p>
                            <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(totauxImmeubles.resultat_net)}</p>
                        </div>
                    </div>
                    
                    {/* Liste des Rapports Détaillés [40] */}
                    <div className="space-y-4">
                        {filteredRapports.map((rapport) => (
                            <div key={rapport.immeuble_id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                <div className="flex justify-between items-center border-b pb-2 mb-3">
                                    <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-blue-500" />
                                        {rapport.immeuble_nom}
                                    </h4> [40]
                                    <p className="text-sm text-gray-600">Bailleur: {rapport.bailleur_prenom} {rapport.bailleur_nom}</p> [40]
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Taux d'occupation</p>
                                        <p className="text-lg font-bold text-purple-600">{rapport.taux_occupation.toFixed(1)}%</p> [40]
                                        <p className="text-xs text-gray-500">{rapport.unites_louees} / {rapport.nombre_unites} produits</p> [40]
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Loyers perçus</p>
                                        <p className="text-lg font-bold text-green-600">{formatCurrency(rapport.loyers_percus)}</p> [40]
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Loyers impayés</p>
                                        <p className="text-lg font-bold text-red-600">{formatCurrency(rapport.loyers_impayes)}</p> [40]
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Frais de gestion</p>
                                        <p className="text-lg font-bold text-blue-600">{formatCurrency(rapport.frais_gestion)}</p> [40]
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Résultat net bailleur</p>
                                        <p className="text-lg font-bold text-gray-800">{formatCurrency(rapport.resultat_net)}</p> [40]
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            
            {/* VUE 4: BILANS MENSUELS BAILLEURS [35, 41, 42] */}
            {currentPage === 'bilans-bailleurs' && (
                <div className="space-y-8">
                     <h2 className="text-2xl font-semibold text-gray-700">Bilans Mensuels Bailleurs (Mois de {new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })})</h2>

                    {bilansBailleurs.map((bilan: BilanBailleur) => (
                        <div key={bilan.bailleur_id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
                            
                            {/* Entête Bailleur */}
                            <div className="flex justify-between items-center border-b pb-3">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {bilan.bailleur_prenom} {bilan.bailleur_nom}
                                </h3> [35]
                                <div className="flex items-center gap-4">
                                    <p className="text-sm text-gray-600">{bilan.immeubles.length} immeuble(s) géré(s)</p> [35]
                                    <button 
                                        onClick={() => exportBilanBailleurPDF(bilan)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                                    >
                                        <Download className="w-4 h-4" /> Bilan PDF
                                    </button>
                                </div>
                            </div>

                            {/* Tableau de Ventilation par Immeuble [41] */}
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Immeuble</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Loyers perçus</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Impayés</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Frais gestion</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant net</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bilan.immeubles.map((immeuble, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{immeuble.immeuble_nom}</td> [41]
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(immeuble.loyers_percus)}</td> [41]
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(immeuble.loyers_impayes)}</td> [41]
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(immeuble.frais_gestion)}</td> [41]
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">{formatCurrency(immeuble.resultat_net)}</td> [41]
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {/* Totaux du Bilan [41, 42] */}
                            <div className="pt-4 border-t border-dashed">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p className="text-gray-600">Total loyers perçus:</p>
                                    <p className="font-semibold text-right text-green-600">{formatCurrency(bilan.total_loyers_percus)}</p> [41]
                                    
                                    <p className="text-gray-600">Total impayés:</p>
                                    <p className="font-semibold text-right text-red-600">{formatCurrency(bilan.total_impayes)}</p> [42]

                                    <p className="text-gray-600">Total frais gestion:</p>
                                    <p className="font-semibold text-right text-blue-600">{formatCurrency(bilan.total_frais)}</p> [42]
                                </div>
                                <div className="mt-4 pt-2 border-t border-gray-300 flex justify-between items-center">
                                    <p className="text-lg font-bold text-gray-800">Montant à verser:</p>
                                    <p className="text-2xl font-extrabold text-blue-800">{formatCurrency(bilan.total_net)}</p> [42]
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}