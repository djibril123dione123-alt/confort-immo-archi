import React, { useState } from 'react';

// Imports de base et de navigation (tirés des sources [1, 2])
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
import { Depenses } from './pages/Depenses';
import { LoyersImpayes } from './pages/LoyersImpayes';
import { FiltresAvances } from './pages/FiltresAvances';

// NOUVEL IMPORT CENTRALISÉ : Remplace Comptabilite, BilanEntreprise, RapportsImmeubles, BilansMensuels
import { TableauDeBordFinancierGlobal } from './pages/TableauDeBordFinancierGlobal';

function AppContent() {
    const { user, loading } = useAuth(); // [1]
    
    // Modification: Utilisation d'une nouvelle clé pour le tableau de bord financier centralisé
    const [currentPage, setCurrentPage] = useState('dashboard'); // [1]

    if (loading) { // [3]
        return (
            <div className="flex items-center justify-center min-h-screen">
                Chargement...
            </div>
        );
    }

    if (!user) { // [3]
        return <LoginForm />;
    }

    const renderPage = () => { // [3]
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />; // [3]
            case 'bailleurs':
                return <Bailleurs />; // [3]
            case 'immeubles':
                return <Immeubles />; // [3]
            case 'unites':
                return <Unites />; // [3]
            case 'locataires':
                return <Locataires />; // [3]
            case 'contrats':
                return <Contrats />; // [3]
            case 'paiements':
                return <Paiements />; // [3]
            case 'depenses':
                return <Depenses />; // [3]
            case 'loyers-impayes':
                return <LoyersImpayes />; // [3]
                
            // NOUVEAU CAS CENTRALISÉ : Remplace les quatre anciens cas financiers 
            case 'tableau-de-bord-financier': 
                return <TableauDeBordFinancierGlobal />; 

            // Les anciens cas 'bilan-entreprise', 'rapports-immeubles', 'bilans-mensuels', 'comptabilite' [3, 4] sont supprimés.
                
            case 'filtres-avances':
                return <FiltresAvances />; // [3]

            default:
                return <Dashboard />; // [4]
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Supposons que la Sidebar gère la navigation et met à jour currentPage */}
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <main className="flex-1 overflow-y-auto bg-gray-50"> 
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
} // [4]

export default App; // [4]
