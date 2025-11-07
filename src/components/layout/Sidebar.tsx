import React, { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

import { TrendingUp, BarChart3, Download } from 'lucide-react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import jsPDF from 'jspdf';

import 'jspdf-autotable';

declare module 'jspdf' {

interface jsPDF {

autoTable: (options: any) => jsPDF;

}

}

export function Commissions() {

const [commissions, setCommissions] = useState([]); [2]

const [chartData, setChartData] = useState([]); [2]

const [stats, setStats] = useState({ [2]

totalCommission: 0, [2]

nombrePaiements: 0, [2]

commissionMoyenne: 0, [2]

});

const [loading, setLoading] = useState(true); [2]

const [selectedMonth, setSelectedMonth] = useState(() => { [2]

const d = new Date(); [2]

return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; [2]

});

useEffect(() => { [2]

loadCommissions(); [2]

}, [selectedMonth]); [2]

const loadCommissions = async () => {

setLoading(true);

try {

const monthStart = `${selectedMonth}-01`; [3]

const monthEnd = new Date(selectedMonth + '-01'); [3]

monthEnd.setMonth(monthEnd.getMonth() + 1); [3]

const monthEndStr = monthEnd.toISOString().slice(0, 10); [3]

const { data } = await supabase

.from('paiements')

.select(`

id,

montant_total,

part_agence,

date_paiement,

statut,

contrats(

locataires(nom, prenom),

unites(nom, immeubles(nom, bailleurs(nom, prenom)))

)

`)

.eq('statut', 'paye')

.gte('mois_concerne', monthStart)

.lt('mois_concerne', monthEndStr)

.order('date_paiement', { ascending: false });

const commissionsData = (data || []).map((p) => ({ [4]

...p,

locataire: p.contrats?.locataires ? `${p.contrats.locataires.prenom} ${p.contrats.locataires.nom}` : '-', [4]

unite: p.contrats?.unites?.nom || '-', [4]

immeuble: p.contrats?.unites?.immeubles?.nom || '-', [4]

bailleur: p.contrats?.unites?.immeubles?.bailleurs

? `${p.contrats.unites.immeubles.bailleurs.prenom} ${p.contrats.unites.immeubles.bailleurs.nom}` [4]

: '-', [4]

})); [4]

setCommissions(commissionsData);

// Statistiques

const total = commissionsData.reduce((sum, c) => sum + Number(c.part_agence), 0); [4]

const moyenne = commissionsData.length > 0 ? total / commissionsData.length : 0; [5]

setStats({ [5]

totalCommission: total, [5]

nombrePaiements: commissionsData.length, [5]

commissionMoyenne: moyenne, [5]

});

// Données par immeuble pour le graphique

const byImmeuble: { [key: string]: number } = {}; [5]

commissionsData.forEach((c) => { [5]

const key = c.immeuble; [5]

byImmeuble[key] = (byImmeuble[key] || 0) + Number(c.part_agence); [5]

});

const chartDataArray = Object.entries(byImmeuble).map(([name, value]) => ({ [5]

name, [5]

commission: Math.round(Number(value)), [5]

}));

setChartData(chartDataArray); [5]

} catch (error) { [6]

console.error('Erreur:', error); [6]

} finally { [6]

setLoading(false); [6]

}

};

const exportPDF = () => { [6]

const doc = new jsPDF(); [6]

const monthName = new Date(selectedMonth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }); [6]

doc.setFontSize(20); [6]

doc.text('RAPPORT DES COMMISSIONS', 105, 15, { align: 'center' }); [6]

doc.setFontSize(12); [6]

doc.text(`Période: ${monthName}`, 14, 30); [6]

// Statistiques

doc.autoTable({ [6]

head: [['Élément', 'Valeur']], [6]

body: [ [6]

['Total commissions', formatCurrency(stats.totalCommission)], [7]

['Nombre de paiements', stats.nombrePaiements.toString()], [7]

['Commission moyenne', formatCurrency(stats.commissionMoyenne)], [7]

],

startY: 40, [7]

});

// Détails

doc.autoTable({ [7]

head: [['Locataire', 'Unité', 'Immeuble', 'Montant', 'Commission']], [7]

body: commissions.map((c) => [ [7]

c.locataire, [7]

c.unite, [7]

c.immeuble, [7]

formatCurrency(c.montant_total), [7]

formatCurrency(c.part_agence), [7]

]),

startY: (doc as any).lastAutoTable.finalY + 10, [7]

styles: { fontSize: 9 }, [7]

});

doc.save(`commissions-${selectedMonth}.pdf`); [7]

};

const formatCurrency = (amount: number) => [8]

new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount); [8]

if (loading) return

Chargement...

; [8]

return (

<div className="p-6 space-y-8">

    <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Commissions</h1> [8]
        <button onClick={exportPDF} /* Structure de bouton déduite de la source [8] */ className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Export PDF</button>
    </div>
    
    <p className="text-gray-600">Suivi des revenus d'agence</p> [8]

    <div className="flex items-center gap-4">

        <label htmlFor="month-select" className="text-lg font-medium">Période</label>
        <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" [8]
        />
    </div>

    {/* Section des Statistiques Clés */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total commissions</h3>
            <p className="text-2xl font-semibold text-blue-600">
                {formatCurrency(stats.totalCommission)} [9]
            </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Nombre de paiements</h3>
            <p className="text-2xl font-semibold text-gray-900">
                {stats.nombrePaiements} [9]
            </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Commission moyenne</h3>
            <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.commissionMoyenne)} [9]
            </p>
        </div>
    </div>

    {/* Section Graphiques */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Commissions par immeuble</h3> [9]
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v: number) => formatCurrency(v)} /> [9]
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Commission']} />
                    <Legend />
                    <Bar dataKey="commission" fill="#3b82f6" />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Répartition</h3> [9]
            {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="commission"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            label={(entry: { name: string }) => entry.name}
                        >
                            {chartData.map((_, idx) => (
                                <Cell key={`cell-${idx}`} fill={['#3b82f6', '#10b981', '#f97316', '#ef4444'][idx % 4]} /> [9]
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} /> [9]
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    </div>


    {/* Tableau de Détails */}
    <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Détail des commissions</h2> [9]
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th> [9]
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locataire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unité</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Immeuble</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant loyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {commissions.map((c: any) => (
                    <tr key={c.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{c.date_paiement}</td> [10]
                        <td className="px-6 py-4 whitespace-nowrap">{c.locataire}</td> [10]
                        <td className="px-6 py-4 whitespace-nowrap">{c.unite}</td> [10]
                        <td className="px-6 py-4 whitespace-nowrap">{c.immeuble}</td> [10]
                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(c.montant_total)}</td> [10]
                        <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">{formatCurrency(c.part_agence)}</td> [10]
                    </tr>
                ))}
            </tbody>
        </table>
    </div>

</div>

);

}