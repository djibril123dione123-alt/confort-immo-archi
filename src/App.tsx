import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Bailleurs } from './pages/Bailleurs';
import { Immeubles } from './pages/Immeubles';
import { Unites } from './pages/Unites';
import { Locataires } from './pages/Locataires';
import { Contrats } from './pages/Contrats';
import { Paiements } from './pages/Paiements';
import { Comptabilite } from './pages/Comptabilite';
import { LoyersImpayes } from './pages/LoyersImpayes';
import { RapportsImmeubles } from './pages/RapportsImmeubles';
import { BilansMensuels } from './pages/BilansMensuels';
import { FiltresAvances } from './pages/FiltresAvances';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-600">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'bailleurs':
        return <Bailleurs />;
      case 'immeubles':
        return <Immeubles />;
      case 'unites':
        return <Unites />;
      case 'locataires':
        return <Locataires />;
      case 'contrats':
        return <Contrats />;
      case 'paiements':
        return <Paiements />;
      case 'loyers-impayes':
        return <LoyersImpayes />;
      case 'rapports-immeubles':
        return <RapportsImmeubles />;
      case 'bilans-mensuels':
        return <BilansMensuels />;
      case 'filtres-avances':
        return <FiltresAvances />;
      case 'comptabilite':
        return <Comptabilite />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
