import React from 'react';

import {
    LayoutDashboard,
    Building2,
    Home, // Icône présente dans les imports de la source [1]
    Users,
    FileText,
    CreditCard,
    Calculator, // Icône pour le TdB Financier Centralisé [1, 2]
    Settings, // Icône présente dans les imports de la source [1]
    LogOut,
    UserCircle,
    DoorOpen,
    AlertCircle,
    BarChart3,
    FileBarChart, // Icône présente dans les imports de la source [1]
    Filter,
    // TrendingDown est nécessaire pour Dépenses [3]
    TrendingDown,
} from 'lucide-react'; // [1]

import { useAuth } from '../../contexts/AuthContext'; // Chemin corrigé pour l'emplacement dans src/components/layout/ [1]

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
} // [1, 4]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
    const { profile, signOut } = useAuth(); // [1, 4]

    // Liste des éléments de menu optimisée : Fusion des rapports financiers en 'tableau-de-bord-financier'
    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [1]
        
        { id: 'bailleurs', label: 'Bailleurs', icon: UserCircle, roles: ['admin', 'agent'] }, // [5]
        { id: 'immeubles', label: 'Immeubles', icon: Building2, roles: ['admin', 'agent', 'bailleur'] }, // [5]
        { id: 'unites', label: 'Produits', icon: DoorOpen, roles: ['admin', 'agent', 'bailleur'] }, // [5]
        { id: 'locataires', label: 'Locataires', icon: Users, roles: ['admin', 'agent', 'comptable'] }, // [5]
        { id: 'contrats', label: 'Contrats', icon: FileText, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [5]
        { id: 'paiements', label: 'Paiements', icon: CreditCard, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [5]

        { id: 'depenses', label: 'Dépenses', icon: TrendingDown, roles: ['admin', 'agent', 'comptable'] }, // [3]
        { id: 'loyers-impayes', label: 'Loyers impayés', icon: AlertCircle, roles: ['admin', 'agent', 'comptable'] }, // [3]
        
        // NOUVEL ÉLÉMENT CENTRALISÉ (Remplace rapports-immeubles, bilans-mensuels, bilan-entreprise, comptabilite)
        { 
            id: 'tableau-de-bord-financier', 
            label: 'Rapports Financiers', 
            icon: Calculator, 
            roles: ['admin', 'agent', 'comptable', 'bailleur'] // Rôles fusionnés de tous les anciens rapports [2, 3]
        }, 
        
        { id: 'filtres-avances', label: 'Filtres avancés', icon: Filter, roles: ['admin', 'agent', 'comptable'] }, // [3]
    ]; 

    const filteredItems = menuItems.filter(item =>
        profile && item.roles.includes(profile.role) // [2]
    );

    // Rendu de la barre latérale
    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col p-5 shadow-lg">
            {/* Header / Logo */}
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
                                // Appel à onNavigate pour changer l'état 'currentPage' dans App.tsx
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                                    currentPage === item.id
                                    ? 'bg-blue-600 text-white' // [6]
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white' // [6]
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