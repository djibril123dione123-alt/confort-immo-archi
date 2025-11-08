import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Download, Calendar, Building2, Users, FileText, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// -------------------------------------------------------------------------
// TYPES ET INTERFACES
// -------------------------------------------------------------------------

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

interface MonthlyStat {
    month: string;
    commission?: number;
    revenus?: number;
    depenses: number;
    solde: number;
}

// -------------------------------------------------------------------------
// DONNÉES DE DÉMONSTRATION
// -------------------------------------------------------------------------

const generateDemoData = (selectedMonth: string) => {
    const currentYear = new Date(selectedMonth).getFullYear();
    
    // Données mensuelles pour l'année
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData: MonthlyStat[] = months.map((month, index) => {
        const revenus = 2500000 + Math.random() * 1000000;
        const depenses = 800000 + Math.random() * 500000;
        return {
            month,
            commission: Math.round(revenus),
            revenus: Math.round(revenus),
            depenses: Math.round(depenses),
            solde: Math.round(revenus - depenses)
        };
    });

    // Bilan entreprise mensuel
    const bilanEntreprise = {
        totalLoyers: 8500000,
        loyersImpayes: 1200000,
        commission: 2850000,
        revenus_alt: 450000,
        totalRevenus: 3300000,
        totalDepenses: 1150000,
        soldeNet: 2150000
    };

    // Stats annuel
    const statsAnnuel = {
        totalRevenus: monthlyData.reduce((sum, m) => sum + (m.revenus || 0), 0),
        totalDepenses: monthlyData.reduce((sum, m) => sum + m.depenses, 0),
        soldeNet: 0
    };
    statsAnnuel.soldeNet = statsAnnuel.totalRevenus - statsAnnuel.totalDepenses;

    // Rapports immeubles
    const rapportsImmeubles: RapportImmeuble[] = [
        {
            immeuble_id: '1',
            immeuble_nom: 'Résidence Les Palmiers',
            bailleur_nom: 'Diop',
            bailleur_prenom: 'Amadou',
            loyers_percus: 2850000,
            loyers_impayes: 450000,
            frais_gestion: 855000,
            resultat_net: 1995000,
            nombre_unites: 12,
            unites_louees: 10,
            taux_occupation: 83.3
        },
        {
            immeuble_id: '2',
            immeuble_nom: 'Immeuble Corniche',
            bailleur_nom: 'Ndiaye',
            bailleur_prenom: 'Fatou',
            loyers_percus: 3200000,
            loyers_impayes: 350000,
            frais_gestion: 960000,
            resultat_net: 2240000,
            nombre_unites: 8,
            unites_louees: 8,
            taux_occupation: 100
        },
        {
            immeuble_id: '3',
            immeuble_nom: 'Villa Almadies',
            bailleur_nom: 'Diop',
            bailleur_prenom: 'Amadou',
            loyers_percus: 1850000,
            loyers_impayes: 200000,
            frais_gestion: 555000,
            resultat_net: 1295000,
            nombre_unites: 6,
            unites_louees: 5,
            taux_occupation: 83.3
        }
    ];

    // Bilans bailleurs
    const bilansBailleurs: BilanBailleur[] = [
        {
            bailleur_id: '1',
            bailleur_nom: 'Diop',
            bailleur_prenom: 'Amadou',
            immeubles: [
                {
                    immeuble_nom: 'Résidence Les Palmiers',
                    loyers_percus: 2850000,
                    loyers_impayes: 450000,
                    frais_gestion: 855000,
                    resultat_net: 1995000
                },
                {
                    immeuble_nom: 'Villa Almadies',
                    loyers_percus: 1850000,
                    loyers_impayes: 200000,
                    frais_gestion: 555000,
                    resultat_net: 1295000
                }
            ],
            total_loyers_percus: 4700000,
            total_impayes: 650000,
            total_frais: 1410000,
            total_net: 3290000
        },
        {
            bailleur_id: '2',
            bailleur_nom: 'Ndiaye',
            bailleur_prenom: 'Fatou',
            immeubles: [
                {
                    immeuble_nom: 'Immeuble Corniche',
                    loyers_percus: 3200000,
                    loyers_impayes: 350000,
                    frais_gestion: 960000,
                    resultat_net: 2240000
                }
            ],
            total_loyers_percus: 3200000,
            total_impayes: 350000,
            total_frais: 960000,
            total_net: 2240000
        }
    ];

    const bailleursFilterList = [
        { label: 'Amadou Diop' },
        { label: 'Fatou Ndiaye' }
    ];

    return {
        bilanEntreprise,
        statsAnnuel,
        monthlyData,
        rapportsImmeubles,
        bilansBailleurs,
        bailleursFilterList
    };
};

// -------------------------------------------------------------------------
// UTILITAIRES
// -------------------------------------------------------------------------

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);

// -------------------------------------------------------------------------
// COMPOSANT PRINCIPAL
// -------------------------------------------------------------------------

export default function TableauDeBordFinancierGlobal() {
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [selectedBailleur, setSelectedBailleur] = useState('');
    const [currentPage, setCurrentPage] = useState('bilan-entreprise');

    // Données
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            const demoData = generateDemoData(selectedMonth);
            setData(demoData);
            setLoading(false);
        }, 500);
    }, [selectedMonth]);

    if (loading || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #FFF4E6, #FFFFFF, #FFF5F5)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full animate-pulse" style={{ background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }}></div>
                    <p className="text-xl font-semibold" style={{ color: '#555555' }}>Chargement des données...</p>
                </div>
            </div>
        );
    }

    const { bilanEntreprise, statsAnnuel, monthlyData, rapportsImmeubles, bilansBailleurs, bailleursFilterList } = data;

    // Filtrage des rapports immeubles
    const filteredRapports = selectedBailleur
        ? rapportsImmeubles.filter((r: RapportImmeuble) => `${r.bailleur_prenom} ${r.bailleur_nom}` === selectedBailleur)
        : rapportsImmeubles;

    const totauxImmeubles = filteredRapports.reduce(
        (acc: any, r: RapportImmeuble) => ({
            loyers_percus: acc.loyers_percus + r.loyers_percus,
            loyers_impayes: acc.loyers_impayes + r.loyers_impayes,
            frais_gestion: acc.frais_gestion + r.frais_gestion,
            resultat_net: acc.resultat_net + r.resultat_net,
        }),
        { loyers_percus: 0, loyers_impayes: 0, frais_gestion: 0, resultat_net: 0 }
    );

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #FFF4E6, #FFFFFF, #FFF5F5)' }}>
            <div className="p-8 space-y-8">
                {/* En-tête */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold mb-2">
                        <span style={{ color: '#C0392B' }}>CONFORT</span>{' '}
                        <span style={{ 
                            background: 'linear-gradient(135deg, #F58220 0%, #FFA64D 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>IMMO</span>{' '}
                        <span style={{ color: '#C0392B' }}>ARCHI</span>
                    </h1>
                    <div className="h-1 w-20 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, #F58220 0%, #C0392B 100%)' }} />
                    <p className="text-lg font-medium" style={{ color: '#555555' }}>Tableau de Bord Financier</p>
                </div>

                {/* Navigation */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'bilan-entreprise', label: 'Bilan Agence', icon: BarChart3 },
                            { id: 'comptabilite', label: 'Comptabilité', icon: FileText },
                            { id: 'rapports-immeubles', label: 'Rapports Immeubles', icon: Building2 },
                            { id: 'bilans-bailleurs', label: 'Bilans Bailleurs', icon: Users }
                        ].map((page) => {
                            const Icon = page.icon;
                            const isActive = currentPage === page.id;
                            return (
                                <button
                                    key={page.id}
                                    onClick={() => setCurrentPage(page.id)}
                                    className="flex-1 min-w-[160px] px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                    style={isActive ? {
                                        background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)',
                                        color: 'white',
                                        boxShadow: '0 4px 6px -1px rgba(245, 130, 32, 0.3)'
                                    } : {
                                        border: '2px solid #F58220',
                                        color: '#F58220',
                                        background: 'white'
                                    }}
                                >
                                    <Icon className="w-5 h-5" />
                                    {page.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sélecteur de période */}
                {currentPage !== 'comptabilite' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                            <Calendar className="w-5 h-5" style={{ color: '#F58220' }} />
                            <label htmlFor="month-selector" className="text-sm font-semibold" style={{ color: '#555555' }}>
                                Période sélectionnée:
                            </label>
                            <input
                                id="month-selector"
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                                style={{ '--tw-ring-color': '#F58220' } as any}
                            />
                        </div>
                    </div>
                )}

                {/* BILAN ENTREPRISE */}
                {currentPage === 'bilan-entreprise' && (
                    <div className="space-y-6">
                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Commission */}
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{ borderTopColor: '#EF4444' }}>
                                <p className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Loyers impayés</p>
                                <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{formatCurrency(totauxImmeubles.loyers_impayes)}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{ borderTopColor: '#F58220' }}>
                                <p className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Frais de gestion</p>
                                <p className="text-2xl font-bold" style={{ color: '#F58220' }}>{formatCurrency(totauxImmeubles.frais_gestion)}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{ borderTopColor: '#555555' }}>
                                <p className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Résultat net</p>
                                <p className="text-2xl font-bold" style={{ color: '#555555' }}>{formatCurrency(totauxImmeubles.resultat_net)}</p>
                            </div>
                        </div>

                        {/* Liste rapports */}
                        <div className="space-y-4">
                            {filteredRapports.map((rapport: RapportImmeuble) => (
                                <div key={rapport.immeuble_id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                                    <div className="flex justify-between items-center border-b pb-4 mb-4" style={{ borderColor: '#E5E7EB' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }}>
                                                <Building2 className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold" style={{ color: '#555555' }}>{rapport.immeuble_nom}</h4>
                                                <p className="text-sm" style={{ color: '#707070' }}>Bailleur: {rapport.bailleur_prenom} {rapport.bailleur_nom}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{
                                                backgroundColor: rapport.taux_occupation >= 90 ? '#D1FAE5' : rapport.taux_occupation >= 70 ? '#FFF4E6' : '#FEE2E2',
                                                color: rapport.taux_occupation >= 90 ? '#065F46' : rapport.taux_occupation >= 70 ? '#E06610' : '#991B1B'
                                            }}>
                                                {rapport.taux_occupation.toFixed(1)}% occupé
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB' }}>
                                            <p className="text-xs font-medium mb-1" style={{ color: '#707070' }}>Unités</p>
                                            <p className="text-lg font-bold" style={{ color: '#555555' }}>{rapport.unites_louees} / {rapport.nombre_unites}</p>
                                        </div>
                                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}>
                                            <p className="text-xs font-medium mb-1" style={{ color: '#065F46' }}>Loyers perçus</p>
                                            <p className="text-lg font-bold" style={{ color: '#10B981' }}>{formatCurrency(rapport.loyers_percus)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#FEE2E2' }}>
                                            <p className="text-xs font-medium mb-1" style={{ color: '#991B1B' }}>Impayés</p>
                                            <p className="text-lg font-bold" style={{ color: '#EF4444' }}>{formatCurrency(rapport.loyers_impayes)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#FFF4E6' }}>
                                            <p className="text-xs font-medium mb-1" style={{ color: '#E06610' }}>Frais gestion</p>
                                            <p className="text-lg font-bold" style={{ color: '#F58220' }}>{formatCurrency(rapport.frais_gestion)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F3F4F6' }}>
                                            <p className="text-xs font-medium mb-1" style={{ color: '#555555' }}>Résultat net</p>
                                            <p className="text-lg font-bold" style={{ color: '#555555' }}>{formatCurrency(rapport.resultat_net)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BILANS BAILLEURS */}
                {currentPage === 'bilans-bailleurs' && (
                    <div className="space-y-6">
                        {bilansBailleurs.map((bilan: BilanBailleur) => (
                            <div key={bilan.bailleur_id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                {/* En-tête bailleur */}
                                <div className="p-6 border-b border-gray-200" style={{ background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                                {bilan.bailleur_prenom.charAt(0)}{bilan.bailleur_nom.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">{bilan.bailleur_prenom} {bilan.bailleur_nom}</h3>
                                                <p className="text-white text-opacity-90">{bilan.immeubles.length} immeuble(s) géré(s)</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => alert('Export PDF en cours de développement')}
                                            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
                                        >
                                            <Download className="w-5 h-5" />
                                            Export PDF
                                        </button>
                                    </div>
                                </div>

                                {/* Tableau immeubles */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead style={{ backgroundColor: '#2D2D2D' }}>
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Immeuble</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Loyers perçus</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Impayés</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Frais gestion</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Montant net</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {bilan.immeubles.map((immeuble, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#555555' }}>
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="w-4 h-4" style={{ color: '#F58220' }} />
                                                            {immeuble.immeuble_nom}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-right font-semibold" style={{ color: '#10B981' }}>{formatCurrency(immeuble.loyers_percus)}</td>
                                                    <td className="px-6 py-4 text-sm text-right font-semibold" style={{ color: '#EF4444' }}>{formatCurrency(immeuble.loyers_impayes)}</td>
                                                    <td className="px-6 py-4 text-sm text-right font-semibold" style={{ color: '#F58220' }}>{formatCurrency(immeuble.frais_gestion)}</td>
                                                    <td className="px-6 py-4 text-sm text-right font-bold" style={{ color: '#555555' }}>{formatCurrency(immeuble.resultat_net)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totaux */}
                                <div className="p-6 border-t-4" style={{ backgroundColor: '#F9FAFB', borderTopColor: '#F58220' }}>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="text-center p-3 rounded-lg bg-white">
                                            <p className="text-xs font-medium mb-1" style={{ color: '#707070' }}>Total loyers perçus</p>
                                            <p className="text-lg font-bold" style={{ color: '#10B981' }}>{formatCurrency(bilan.total_loyers_percus)}</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-white">
                                            <p className="text-xs font-medium mb-1" style={{ color: '#707070' }}>Total impayés</p>
                                            <p className="text-lg font-bold" style={{ color: '#EF4444' }}>{formatCurrency(bilan.total_impayes)}</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-white">
                                            <p className="text-xs font-medium mb-1" style={{ color: '#707070' }}>Total frais gestion</p>
                                            <p className="text-lg font-bold" style={{ color: '#F58220' }}>{formatCurrency(bilan.total_frais)}</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }}>
                                            <p className="text-xs font-semibold mb-1 text-white text-opacity-90">MONTANT À VERSER</p>
                                            <p className="text-2xl font-extrabold text-white">{formatCurrency(bilan.total_net)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} borderTopColor: '#F58220' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }}>
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium" style={{ color: '#555555' }}>Commission agence</h3>
                                        <p className="text-2xl font-bold" style={{ color: '#F58220' }}>{formatCurrency(bilanEntreprise.commission)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Total revenus */}
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{ borderTopColor: '#10B981' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#10B981' }}>
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium" style={{ color: '#555555' }}>Total revenus</h3>
                                        <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{formatCurrency(bilanEntreprise.totalRevenus)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Total dépenses */}
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{ borderTopColor: '#EF4444' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#EF4444' }}>
                                        <TrendingDown className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium" style={{ color: '#555555' }}>Total dépenses</h3>
                                        <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{formatCurrency(bilanEntreprise.totalDepenses)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Solde net */}
                            <div className={`rounded-2xl shadow-lg border-t-4 p-6 ${bilanEntreprise.soldeNet >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-red-50 to-orange-50'}`} style={{ borderTopColor: bilanEntreprise.soldeNet >= 0 ? '#10B981' : '#F58220' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 rounded-lg" style={{ background: bilanEntreprise.soldeNet >= 0 ? '#10B981' : 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }}>
                                        {bilanEntreprise.soldeNet >= 0 ? <TrendingUp className="w-6 h-6 text-white" /> : <TrendingDown className="w-6 h-6 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold" style={{ color: '#555555' }}>Solde net</h3>
                                        <p className="text-3xl font-extrabold" style={{ color: bilanEntreprise.soldeNet >= 0 ? '#10B981' : '#C0392B' }}>{formatCurrency(bilanEntreprise.soldeNet)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Résumé */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-semibold mb-4" style={{ color: '#555555' }}>Résumé du mois</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#FFF4E6' }}>
                                    <p className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Total loyers</p>
                                    <p className="text-2xl font-bold" style={{ color: '#F58220' }}>{formatCurrency(bilanEntreprise.totalLoyers)}</p>
                                </div>
                                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#FEE2E2' }}>
                                    <p className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Impayés</p>
                                    <p className="text-2xl font-bold" style={{ color: '#C0392B' }}>{formatCurrency(bilanEntreprise.loyersImpayes)}</p>
                                </div>
                                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}>
                                    <p className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Autres revenus</p>
                                    <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{formatCurrency(bilanEntreprise.revenus_alt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Graphique tendance */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-semibold mb-6" style={{ color: '#555555' }}>Tendance annuelle</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="month" stroke="#555555" />
                                    <YAxis tickFormatter={(v) => formatCurrency(v)} stroke="#555555" />
                                    <Tooltip 
                                        formatter={(value: number) => [formatCurrency(value), '']}
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="commission" stroke="#F58220" strokeWidth={3} name="Commission" dot={{ fill: '#F58220', r: 4 }} />
                                    <Line type="monotone" dataKey="depenses" stroke="#C0392B" strokeWidth={3} name="Dépenses" dot={{ fill: '#C0392B', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* COMPTABILITÉ */}
                {currentPage === 'comptabilite' && (
                    <div className="space-y-6">
                        {/* KPIs annuels */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{ borderTopColor: '#10B981' }}>
                                <h3 className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Total Revenus (Annuel)</h3>
                                <p className="text-3xl font-bold" style={{ color: '#10B981' }}>{formatCurrency(statsAnnuel.totalRevenus)}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{ borderTopColor: '#EF4444' }}>
                                <h3 className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Total Dépenses (Annuel)</h3>
                                <p className="text-3xl font-bold" style={{ color: '#EF4444' }}>{formatCurrency(statsAnnuel.totalDepenses)}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{ borderTopColor: statsAnnuel.soldeNet >= 0 ? '#10B981' : '#C0392B' }}>
                                <h3 className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Solde Net (Annuel)</h3>
                                <p className="text-3xl font-bold" style={{ color: statsAnnuel.soldeNet >= 0 ? '#10B981' : '#C0392B' }}>{formatCurrency(statsAnnuel.soldeNet)}</p>
                            </div>
                        </div>

                        {/* Graphique barres */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-semibold mb-6" style={{ color: '#555555' }}>Évolution mensuelle</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="month" stroke="#555555" />
                                    <YAxis tickFormatter={(v) => formatCurrency(v)} stroke="#555555" />
                                    <Tooltip 
                                        formatter={(value: number) => [formatCurrency(value), '']}
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="revenus" fill="#F58220" name="Revenus" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="depenses" fill="#C0392B" name="Dépenses" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Tableau détails */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-xl font-semibold" style={{ color: '#555555' }}>Détails mensuels</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead style={{ backgroundColor: '#2D2D2D' }}>
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Mois</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Revenus</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Dépenses</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase">Solde</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {monthlyData.map((item, index) => (
                                            <tr key={item.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 text-sm font-medium" style={{ color: '#555555' }}>{item.month}</td>
                                                <td className="px-6 py-4 text-sm text-right" style={{ color: '#10B981' }}>{formatCurrency(item.revenus || 0)}</td>
                                                <td className="px-6 py-4 text-sm text-right" style={{ color: '#EF4444' }}>{formatCurrency(item.depenses)}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-right" style={{ color: item.solde >= 0 ? '#10B981' : '#C0392B' }}>{formatCurrency(item.solde)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* RAPPORTS IMMEUBLES */}
                {currentPage === 'rapports-immeubles' && (
                    <div className="space-y-6">
                        {/* Filtre */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-4">
                                <Users className="w-5 h-5" style={{ color: '#F58220' }} />
                                <label htmlFor="bailleur-filter" className="text-sm font-semibold" style={{ color: '#555555' }}>
                                    Filtrer par bailleur:
                                </label>
                                <select
                                    id="bailleur-filter"
                                    value={selectedBailleur}
                                    onChange={(e) => setSelectedBailleur(e.target.value)}
                                    className="flex-1 max-w-md px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                                    style={{ '--tw-ring-color': '#F58220' } as any}
                                >
                                    <option value="">Tous les bailleurs</option>
                                    {bailleursFilterList.map((b: any, index: number) => (
                                        <option key={index} value={b.label}>{b.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Totaux */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{ borderTopColor: '#10B981' }}>
                                <p className="text-sm font-medium mb-2" style={{ color: '#555555' }}>Loyers perçus</p>
                                <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{formatCurrency(totauxImmeubles.loyers_percus)}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border-t-4 p-6" style={{