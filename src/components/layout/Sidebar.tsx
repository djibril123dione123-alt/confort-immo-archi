import React from 'react';

import {
    LayoutDashboard,
    Building2,
    Users,
    FileText,
    CreditCard,
    Calculator, // Utilisé pour le TdB Financier Centralisé [3]
    Settings,
    LogOut,
    UserCircle,
    DoorOpen,
    AlertCircle,
    BarChart3,
    Filter,
    TrendingDown, // Utilisé pour Dépenses [3]
    TrendingUp, // Utilisé pour Commissions
} from 'lucide-react'; 

import { useAuth } from '../../contexts/AuthContext'; 

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {

    const { profile, signOut } = useAuth(); 

    // Liste des éléments de menu optimisée : Fusion des rapports financiers en 'tableau-de-bord-financier' [4]
    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [4]

        // Gestion Immobilière
        { id: 'bailleurs', label: 'Bailleurs', icon: UserCircle, roles: ['admin', 'agent'] }, // [4]
        { id: 'immeubles', label: 'Immeubles', icon: Building2, roles: ['admin', 'agent', 'bailleur'] }, // [4]
        { id: 'unites', label: 'Produits', icon: DoorOpen, roles: ['admin', 'agent', 'bailleur'] }, // [1]
        { id: 'locataires', label: 'Locataires', icon: Users, roles: ['admin', 'agent', 'comptable'] }, // [1]
        { id: 'contrats', label: 'Contrats', icon: FileText, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [1]
        
        // Finances Transactionnelles
        { id: 'paiements', label: 'Paiements', icon: CreditCard, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [1]
        { id: 'commissions', label: 'Commissions', icon: TrendingUp, roles: ['admin', 'agent', 'comptable'] }, // NOUVEAU [1]
        { id: 'depenses', label: 'Dépenses', icon: TrendingDown, roles: ['admin', 'agent', 'comptable'] }, // [2]
        { id: 'loyers-impayes', label: 'Loyers impayés', icon: AlertCircle, roles: ['admin', 'agent', 'comptable'] }, // [2]

        // NOUVEL ÉLÉMENT CENTRALISÉ (Remplace Bilan, Comptabilité, Rapports)
        {
            id: 'tableau-de-bord-financier',
            label: 'Rapports Financiers',
            icon: Calculator,
            roles: ['admin', 'agent', 'comptable', 'bailleur']
        }, // [2]

        { id: 'filtres-avances', label: 'Filtres avancés', icon: Filter, roles: ['admin', 'agent', 'comptable'] }, // [2]
    ];

    const filteredItems = menuItems.filter(item =>
        profile && item.roles.includes(profile.role) // [5]
    );

    // Rendu de la barre latérale
    return (
        <div className="flex flex-col h-full bg-slate-900 text-white p-6 shadow-xl">
            
            {/* EN-TÊTE / LOGO */}
            <div className="mb-8 p-2">
                <img
                    src="/templates/Logo confort immo archi neutre.png"
                    alt="Logo Confort Immo Archi"
                    className="w-full h-auto object-contain"
                />
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-4">Gestion immobilière</p>

            {/* Menu de navigation [5] */}
            <nav className="flex-grow space-y-2">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <a
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition cursor-pointer ${
                                currentPage === item.id
                                    ? 'bg-blue-600 text-white' // [6]
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white' // [6]
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </a>
                    );
                })}
            </nav>

            {/* Pied de page / Profil / Déconnexion [6] */}
            <div className="mt-auto pt-6 border-t border-slate-800">
                <div className="mb-4">
                    <p className="text-sm font-semibold">{profile?.prenom} {profile?.nom}</p>
                    <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
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
