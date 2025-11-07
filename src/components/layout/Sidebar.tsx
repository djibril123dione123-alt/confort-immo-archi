import React from 'react';

import {
    LayoutDashboard,
    Building2,
    Home, 
    Users,
    FileText,
    CreditCard,
    Calculator, // Utilisé pour le TdB Financier Centralisé
    Settings, 
    LogOut,
    UserCircle,
    DoorOpen,
    AlertCircle,
    BarChart3,
    FileBarChart, 
    Filter,
    TrendingDown, // Utilisé pour Dépenses
} from 'lucide-react'; // [1]

import { useAuth } from '../../contexts/AuthContext'; // Chemin pour src/components/layout/

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
} // [1]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
    const { profile, signOut } = useAuth(); // [1]

    // Liste des éléments de menu optimisée : Fusion des rapports financiers en 'tableau-de-bord-financier'
    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [1]
        
        { id: 'bailleurs', label: 'Bailleurs', icon: UserCircle, roles: ['admin', 'agent'] }, // [2]
        { id: 'immeubles', label: 'Immeubles', icon: Building2, roles: ['admin', 'agent', 'bailleur'] }, // [2]
        { id: 'unites', label: 'Produits', icon: DoorOpen, roles: ['admin', 'agent', 'bailleur'] }, // [2]
        { id: 'locataires', label: 'Locataires', icon: Users, roles: ['admin', 'agent', 'comptable'] }, // [2]
        { id: 'contrats', label: 'Contrats', icon: FileText, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [2]
        { id: 'paiements', label: 'Paiements', icon: CreditCard, roles: ['admin', 'agent', 'comptable', 'bailleur'] }, // [2]

        { id: 'depenses', label: 'Dépenses', icon: TrendingDown, roles: ['admin', 'agent', 'comptable'] }, // [3]
        { id: 'commissions', label: 'Commissions', icon: TrendingUp, roles: ['admin', 'agent', 'comptable'] },
        { id: 'loyers-impayes', label: 'Loyers impayés', icon: AlertCircle, roles: ['admin', 'agent', 'comptable'] }, // [3]
        
        // NOUVEL ÉLÉMENT CENTRALISÉ
        { 
            id: 'tableau-de-bord-financier', 
            label: 'Rapports Financiers', 
            icon: Calculator, 
            roles: ['admin', 'agent', 'comptable', 'bailleur'] 
        }, 
        
        { id: 'filtres-avances', label: 'Filtres avancés', icon: Filter, roles: ['admin', 'agent', 'comptable'] }, // [3]
    ]; // [4]

    const filteredItems = menuItems.filter(item =>
        profile && item.roles.includes(profile.role) // [4]
    );

    // Rendu de la barre latérale
    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col p-5 shadow-lg">
            
            {/* EN-TÊTE MODIFIÉ AVEC LE LOGO */}
            <div className="mb-8 p-1 text-center">
                <img 
                    src="/templates/Logo confort immo archi neutre.png" 
                    alt="Logo Confort Immo Archi" 
                    className="w-full h-auto object-contain" 
                />
            </div>
            
            {/* Menu de navigation */}
            <nav className="flex-1 space-y-2">
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