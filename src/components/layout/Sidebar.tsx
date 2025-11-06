import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  CreditCard,
  Calculator,
  Settings,
  LogOut,
  UserCircle,
  DoorOpen,
  AlertCircle,
  BarChart3,
  FileBarChart,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'agent', 'comptable', 'bailleur'] },
    { id: 'bailleurs', label: 'Bailleurs', icon: UserCircle, roles: ['admin', 'agent'] },
    { id: 'immeubles', label: 'Immeubles', icon: Building2, roles: ['admin', 'agent', 'bailleur'] },
    { id: 'unites', label: 'Produits', icon: DoorOpen, roles: ['admin', 'agent', 'bailleur'] },
    { id: 'locataires', label: 'Locataires', icon: Users, roles: ['admin', 'agent', 'comptable'] },
    { id: 'contrats', label: 'Contrats', icon: FileText, roles: ['admin', 'agent', 'comptable', 'bailleur'] },
    { id: 'paiements', label: 'Paiements', icon: CreditCard, roles: ['admin', 'agent', 'comptable', 'bailleur'] },
    { id: 'loyers-impayes', label: 'Loyers impayés', icon: AlertCircle, roles: ['admin', 'agent', 'comptable'] },
    { id: 'bilan-entreprise', label: 'Bilan entreprise', icon: BarChart3, roles: ['admin', 'comptable'] },
    { id: 'rapports-immeubles', label: 'Rapports immeubles', icon: BarChart3, roles: ['admin', 'agent', 'comptable', 'bailleur'] },
    { id: 'bilans-mensuels', label: 'Bilans mensuels', icon: FileBarChart, roles: ['admin', 'agent', 'comptable', 'bailleur'] },
    { id: 'filtres-avances', label: 'Filtres avancés', icon: Filter, roles: ['admin', 'agent', 'comptable'] },
    { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, roles: ['admin', 'comptable'] },
  ];

  const filteredItems = menuItems.filter(item =>
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-lg font-bold">Confort Immo Archi</h1>
            <p className="text-xs text-slate-400">Gestion immobilière</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    currentPage === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-3 px-3 py-2 bg-slate-800 rounded-lg">
          <p className="text-sm font-medium">{profile?.prenom} {profile?.nom}</p>
          <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
