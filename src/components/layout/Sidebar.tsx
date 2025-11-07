import React from 'react';

import {
    LayoutDashboard,
    Building2,
    Users,
    FileText,
    CreditCard,
    Calculator, // Utilisé pour le nouveau TdB Financier [3]
    LogOut,
    UserCircle,
    DoorOpen,
    AlertCircle,
    BarChart3,
    Filter,
    // TrendingDown (Icone des dépenses, présent dans les imports Lucide de la source [3])
} from 'lucide-react'; //
import { TrendingDown } from 'lucide-react'; // Ajouté explicitement pour Dépenses, bien que l'importation soit présente dans [3]

import { useAuth } from '../../contexts/AuthContext'; //

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
    const { profile, signOut } = useAuth(); //

    // Liste des éléments de menu optimisée
    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [3]
        
        { id: 'bailleurs', label: 'Bailleurs', icon: UserCircle, roles: ['admin', 'agent'] }, // [4]
        { id: 'immeubles', label: 'Immeubles', icon: Building2, roles: ['admin', 'agent', 'bailleur'] }, // [4]
        { id: 'unites', label: 'Produits', icon: DoorOpen, roles: ['admin', 'agent', 'bailleur'] }, // [4]
        { id: 'locataires', label: 'Locataires', icon: Users, roles: ['admin', 'agent', 'comptable'] }, // [4]
        { id: 'contrats', label: 'Contrats', icon: FileText, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [4]
        { id: 'paiements', label: 'Paiements', icon: CreditCard, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [4]

        { id: 'depenses', label: 'Dépenses', icon: TrendingDown, roles: ['admin', 'agent', 'comptable'] }, // [1]
        { id: 'loyers-impayes', label: 'Loyers impayés', icon: AlertCircle, roles: ['admin', 'agent', 'comptable'] }, // [1]
        
        // NOUVEL ÉLÉMENT CENTRALISÉ (Fusionne Rapports immeubles, Bilans mensuels, Bilan entreprise, Comptabilité) [1, 2]
        { 
            id: 'tableau-de-bord-financier', 
            label: 'Rapports Financiers', 
            icon: Calculator, // Utilisé dans l'ancienne Comptabilité [2]
            roles: ['admin', 'agent', 'comptable', 'bailleur'] // Rôles fusionnés
        }, 
        
        { id: 'filtres-avances', label: 'Filtres avancés', icon: Filter, roles: ['admin', 'agent', 'comptable'] }, // [1]
        
        // Les éléments 'rapports-immeubles', 'bilans-mensuels', 'bilan-entreprise', et 'comptabilite' ont été supprimés.
    ];

    const filteredItems = menuItems.filter(item =>
        profile && item.roles.includes(profile.role) //
    );

    // Rendu de la barre latérale [5]
    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col p-5 shadow-lg">
            {/* Header / Logo (tiré des fragments) */}
            <div className="mb-8 text-2xl font-bold text-blue-400">
                Confort Immo Archi
            </div>
            
            {/* Menu de navigation */}
            <nav className="flex-1 space-y-2">
                <p className="text-sm font-semibold uppercase text-slate-500 mb-3">
                    Gestion immobilière
                </p>
                {filteredItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div key={item.id}>
                            <button
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                                    currentPage === item.id
                                    ? 'bg-blue-600 text-white' // [5]
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white' // [5]
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        </div>
                    );
                })}
            </nav>

            {/* Pied de page / Profil / Déconnexion */}
            <div className="pt-4 border-t border-slate-700">
                <div className="p-3 bg-slate-800 rounded-lg mb-4">
                    <p className="font-semibold">{profile?.prenom} {profile?.nom}</p>
                    <p className="text-sm text-slate-400">{profile?.role}</p>
                </div>
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition"
                >
                    <LogOut className="w-5 h-5" />
                    Déconnexion
                </button>
            </div>
        </div>
    );
}