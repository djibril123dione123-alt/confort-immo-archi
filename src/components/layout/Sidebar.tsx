import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  CreditCard, 
  Calculator, 
  LogOut, 
  UserCircle, 
  DoorOpen, 
  AlertCircle, 
  Filter, 
  TrendingDown,
  ChevronRight,
  type LucideIcon
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

// ==================== TYPES ====================

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

// ==================== CONSTANTES ====================

// Palette Confort Immo Archi
const BRAND_COLORS = {
  primary: '#F58220',        // Orange Confort Dominante
  primaryLight: '#FFA64D',   // Orange Confort Clair
  red: '#C0392B',            // Rouge Confort
  grayLight: '#707070',      // Gris Confort Clair
  grayDark: '#3A3A3A',       // Gris Confort Foncé
  bgDark: '#2D2D2D',         // Fond sombre
} as const;

// Styles CSS réutilisables
const STYLES = {
  activeBackground: `rgba(245, 130, 32, 0.15)`,
  navItemBase: "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer relative group",
  navItemInactive: "text-slate-400 hover:bg-gray-800 hover:text-white",
  navItemActive: "font-semibold",
} as const;

// ==================== DONNÉES ====================

const MENU_ITEMS: MenuItem[] = [
  { 
    id: 'dashboard', 
    label: 'Tableau de bord', 
    icon: LayoutDashboard, 
    roles: ['admin', 'agent', 'comptable', 'bailleur'] 
  },
  { 
    id: 'bailleurs', 
    label: 'Bailleurs', 
    icon: UserCircle, 
    roles: ['admin', 'agent'] 
  },
  { 
    id: 'immeubles', 
    label: 'Immeubles', 
    icon: Building2, 
    roles: ['admin', 'agent', 'bailleur'] 
  },
  { 
    id: 'unites', 
    label: 'Produits', 
    icon: DoorOpen, 
    roles: ['admin', 'agent', 'bailleur'] 
  },
  { 
    id: 'locataires', 
    label: 'Locataires', 
    icon: Users, 
    roles: ['admin', 'agent', 'comptable'] 
  },
  { 
    id: 'contrats', 
    label: 'Contrats', 
    icon: FileText, 
    roles: ['admin', 'agent', 'comptable', 'bailleur'] 
  },
  { 
    id: 'paiements', 
    label: 'Paiements', 
    icon: CreditCard, 
    roles: ['admin', 'agent', 'comptable', 'bailleur'] 
  },
  { 
    id: 'depenses', 
    label: 'Dépenses', 
    icon: TrendingDown, 
    roles: ['admin', 'agent', 'comptable'] 
  },
  { 
    id: 'loyers-impayes', 
    label: 'Loyers impayés', 
    icon: AlertCircle, 
    roles: ['admin', 'agent', 'comptable'] 
  },
  {
    id: 'tableau-de-bord-financier',
    label: 'Rapports Financiers',
    icon: Calculator,
    roles: ['admin', 'agent', 'comptable', 'bailleur']
  },
  { 
    id: 'filtres-avances', 
    label: 'Filtres avancés', 
    icon: Filter, 
    roles: ['admin', 'agent', 'comptable'] 
  },
];

// ==================== COMPOSANTS ====================

/**
 * Composant pour l'en-tête avec logo
 */
const SidebarHeader: React.FC = () => (
  <div className="mb-2 pt-2 px-2">
    <img
      src="/templates/Logo confort immo archi neutre.png"
      alt="Logo Confort Immo Archi"
      className="w-full h-auto object-contain max-h-34"
      loading="lazy"
    />
  </div>
);

/**
 * Composant pour un élément de navigation
 */
interface NavItemProps {
  item: MenuItem;
  isActive: boolean;
  onNavigate: (id: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, onNavigate }) => {
  const Icon = item.icon;
  
  const itemClasses = `
    ${STYLES.navItemBase} 
    ${isActive ? STYLES.navItemActive : STYLES.navItemInactive}
  `;

  const itemStyles = isActive 
    ? { backgroundColor: STYLES.activeBackground, color: BRAND_COLORS.primaryLight }
    : {};

  const iconColor = isActive ? BRAND_COLORS.primary : BRAND_COLORS.grayLight;

  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={itemClasses}
      style={itemStyles}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Indicateur vertical pour l'élément actif */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r"
          style={{ backgroundColor: BRAND_COLORS.primary }}
          aria-hidden="true"
        />
      )}

      {/* Icône */}
      <Icon
        className="w-5 h-5 transition-colors"
        style={{ color: iconColor }}
        aria-hidden="true"
      />

      {/* Label */}
      <span className="flex-1 text-left text-sm">{item.label}</span>

      {/* Indicateur de flèche pour l'élément actif */}
      {isActive && (
        <ChevronRight
          className="w-4 h-4 ml-auto"
          style={{ color: BRAND_COLORS.primary }}
          aria-hidden="true"
        />
      )}
    </button>
  );
};

/**
 * Composant pour le profil utilisateur
 */
interface UserProfileProps {
  profile: {
    prenom?: string;
    nom?: string;
    role?: string;
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ profile }) => {
  const initials = profile.prenom?.charAt(0) || 'U';
  const fullName = `${profile.prenom || ''} ${profile.nom || ''}`.trim();

  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-gray-800/50">
      {/* Avatar avec dégradé */}
      <div 
        className="w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-lg flex-shrink-0" 
        style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.red} 100%)` }}
        aria-label={`Avatar de ${fullName}`}
      >
        {initials}
      </div>

      {/* Informations utilisateur */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate" title={fullName}>
          {fullName || 'Utilisateur'}
        </p>
        <p className="text-xs capitalize truncate" style={{ color: BRAND_COLORS.primaryLight }}>
          {profile.role || 'N/A'}
        </p>
      </div>
    </div>
  );
};

/**
 * Composant pour le bouton de déconnexion
 */
interface LogoutButtonProps {
  onSignOut: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onSignOut }) => (
  <button
    onClick={onSignOut}
    className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-gray-800 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
    aria-label="Se déconnecter"
  >
    <LogOut className="w-5 h-5" aria-hidden="true" />
    <span className="text-sm font-medium">Déconnexion</span>
  </button>
);

// ==================== COMPOSANT PRINCIPAL ====================

/**
 * Sidebar principale de l'application Confort Immo Archi
 */
export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();

  // Filtrage des éléments selon le rôle
  const filteredItems = React.useMemo(() => 
    MENU_ITEMS.filter(item => 
      profile?.role && item.roles.includes(profile.role)
    ),
    [profile?.role]
  );

  // Gestion de la déconnexion
  const handleSignOut = React.useCallback(() => {
    if (profile) {
      signOut();
    }
  }, [profile, signOut]);

  return (
    <div 
      className="flex flex-col h-full w-64 overflow-y-auto"
      style={{ backgroundColor: BRAND_COLORS.bgDark }}
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* En-tête avec logo */}
      <SidebarHeader />

      {/* Menu de navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {filteredItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={currentPage === item.id}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Pied de page avec profil et déconnexion */}
      <div 
        className="px-3 py-4 mt-auto border-t"
        style={{ borderColor: BRAND_COLORS.grayDark }}
      >
        {profile && <UserProfile profile={profile} />}
        <LogoutButton onSignOut={handleSignOut} />
      </div>
    </div>
  );
}