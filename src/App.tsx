import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';

// ==================== LAZY LOADING DES PAGES ====================
// Amélioration des performances avec code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Bailleurs = lazy(() => import('./pages/Bailleurs').then(m => ({ default: m.Bailleurs })));
const Immeubles = lazy(() => import('./pages/Immeubles').then(m => ({ default: m.Immeubles })));
const Unites = lazy(() => import('./pages/Unites').then(m => ({ default: m.Unites })));
const Locataires = lazy(() => import('./pages/Locataires').then(m => ({ default: m.Locataires })));
const Contrats = lazy(() => import('./pages/Contrats').then(m => ({ default: m.Contrats })));
const Paiements = lazy(() => import('./pages/Paiements').then(m => ({ default: m.Paiements })));
const Depenses = lazy(() => import('./pages/Depenses').then(m => ({ default: m.Depenses })));
const Commissions = lazy(() => import('./pages/Commissions').then(m => ({ default: m.Commissions })));
const LoyersImpayes = lazy(() => import('./pages/LoyersImpayes').then(m => ({ default: m.LoyersImpayes })));
const FiltresAvances = lazy(() => import('./pages/FiltresAvances').then(m => ({ default: m.FiltresAvances })));
const TableauDeBordFinancierGlobal = lazy(() => 
  import('./pages/TableauDeBordFinancierGlobal').then(m => ({ default: m.TableauDeBordFinancierGlobal }))
);

// ==================== TYPES ====================

type PageId = 
  | 'dashboard'
  | 'bailleurs'
  | 'immeubles'
  | 'unites'
  | 'locataires'
  | 'contrats'
  | 'paiements'
  | 'depenses'
  | 'commissions'
  | 'loyers-impayes'
  | 'tableau-de-bord-financier'
  | 'filtres-avances';

interface RouteConfig {
  id: PageId;
  component: React.LazyExoticComponent<React.FC>;
  title: string;
}

// ==================== CONFIGURATION DES ROUTES ====================

const ROUTES: RouteConfig[] = [
  { id: 'dashboard', component: Dashboard, title: 'Tableau de bord' },
  { id: 'bailleurs', component: Bailleurs, title: 'Bailleurs' },
  { id: 'immeubles', component: Immeubles, title: 'Immeubles' },
  { id: 'unites', component: Unites, title: 'Produits' },
  { id: 'locataires', component: Locataires, title: 'Locataires' },
  { id: 'contrats', component: Contrats, title: 'Contrats' },
  { id: 'paiements', component: Paiements, title: 'Paiements' },
  { id: 'depenses', component: Depenses, title: 'Dépenses' },
  { id: 'commissions', component: Commissions, title: 'Commissions' },
  { id: 'loyers-impayes', component: LoyersImpayes, title: 'Loyers impayés' },
  { id: 'tableau-de-bord-financier', component: TableauDeBordFinancierGlobal, title: 'Rapports Financiers' },
  { id: 'filtres-avances', component: FiltresAvances, title: 'Filtres avancés' },
];

// ==================== CONSTANTES ====================

const BRAND_COLORS = {
  primary: '#F58220',
  red: '#C0392B',
  primaryLight: '#FFA64D',
};

// ==================== COMPOSANTS ====================

/**
 * Composant de chargement élégant
 */
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4">
      {/* Spinner avec dégradé */}
      <div 
        className="w-16 h-16 mx-auto rounded-full animate-spin"
        style={{
          background: `conic-gradient(from 0deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.red}, ${BRAND_COLORS.primary})`,
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0)',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0)',
        }}
      />
      
      {/* Logo texte */}
      <div className="text-2xl font-bold">
        <span style={{ color: BRAND_COLORS.red }}>CONFORT</span>{' '}
        <span style={{ 
          background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryLight} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>IMMO</span>
      </div>
      
      <p className="text-sm text-gray-500">Chargement en cours...</p>
    </div>
  </div>
);

/**
 * Rendu de la page avec gestion d'erreur
 */
interface PageRendererProps {
  pageId: PageId;
}

const PageRenderer: React.FC<PageRendererProps> = ({ pageId }) => {
  const route = ROUTES.find(r => r.id === pageId);
  
  if (!route) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div 
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-3xl font-bold"
            style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.red} 100%)` }}
          >
            404
          </div>
          <h2 className="text-2xl font-bold" style={{ color: BRAND_COLORS.red }}>
            Page introuvable
          </h2>
          <p className="text-gray-600">
            La page demandée n'existe pas.
          </p>
        </div>
      </div>
    );
  }

  const PageComponent = route.component;

  return (
    <Suspense fallback={<PageLoader />}>
      <PageComponent />
    </Suspense>
  );
};

/**
 * Contenu principal de l'application (authentifié)
 */
function AppContent() {
  const { user, profile, signOut, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  // Chargement initial
  if (loading) {
    return <PageLoader />;
  }

  // Non authentifié
  if (!user) {
    return <LoginForm />;
  }

  // Authentifié
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={(page) => setCurrentPage(page as PageId)}
        profile={profile}
        signOut={signOut}
      />
      
      <main className="flex-1 overflow-y-auto">
        <PageRenderer pageId={currentPage} />
      </main>
    </div>
  );
}

/**
 * Composant racine avec Provider
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;