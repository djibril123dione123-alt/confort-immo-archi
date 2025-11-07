import React, { useState } from 'react';

import { AuthProvider, useAuth } from './contexts/AuthContext'; // [13]

import { LoginForm } from './components/auth/LoginForm'; // [13]

import { Sidebar } from './components/layout/Sidebar'; // [13]

import { Dashboard } from './pages/Dashboard'; // [13]

import { Bailleurs } from './pages/Bailleurs'; // [13]

import { Immeubles } from './pages/Immeubles'; // [13]

import { Unites } from './pages/Unites'; // [13]

import { Locataires } from './pages/Locataires'; // [13]

import { Contrats } from './pages/Contrats'; // [13]

import { Paiements } from './pages/Paiements'; // [13]

import { Depenses } from './pages/Depenses'; // [14]

import { LoyersImpayes } from './pages/LoyersImpayes'; // [14]

import { FiltresAvances } from './pages/FiltresAvances'; // [14]

// --- Imports Financiers Optimisés ---
// Suppression des imports obsolètes (Comptabilite, BilanEntreprise, RapportsImmeubles, BilansMensuels) [1]
import { Commissions } from './pages/Commissions'; // NOUVEAU, basé sur la conversation
// Composant Placeholder pour la centralisation, en l'absence du code source de ce nouveau TdB Global
const TableauDeBordFinancierGlobal = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold">Tableau de Bord Financier Global</h1>
        <p className="text-gray-600">Interface centralisée des bilans, comptabilité et rapports.</p>
    </div>
);


function AppContent() {

    const { user, loading } = useAuth(); // [14]

    const [currentPage, setCurrentPage] = useState('dashboard'); // [14]

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-xl font-medium">
                Chargement...
            </div>
        ); // [15]
    }

    if (!user) {
        return <LoginForm />; // [15]
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />; // [15]

            case 'bailleurs':
                return <Bailleurs />; // [15]

            case 'immeubles':
                return <Immeubles />; // [15]

            case 'unites':
                return <Unites />; // [15]

            case 'locataires':
                return <Locataires />; // [15]

            case 'contrats':
                return <Contrats />; // [15]

            case 'paiements':
                return <Paiements />; // [15]

            case 'depenses':
                return <Depenses />; // [15]

            case 'loyers-impayes':
                return <LoyersImpayes />; // [15]
            
            // --- Nouvelles Routes/Routes Centralisées ---
            case 'commissions':
                return <Commissions />; // NOUVELLE PAGE
                
            case 'tableau-de-bord-financier':
                // Remplace les routes obsolètes: bilan-entreprise [15], rapports-immeubles [15], bilans-mensuels [15], comptabilite [16]
                return <TableauDeBordFinancierGlobal />; 
            // -------------------------------------------
                
            case 'filtres-avances':
                return <FiltresAvances />; // [15]

            default:
                // Retourne au Tableau de bord si la page n'est pas reconnue
                return <Dashboard />; // Modification pour éviter la page blanche [16]
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
            <main className="flex-1 overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    ); // Structure du return déduite des sources [16] et du contexte
}

function App() {

    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    ); // Structure du return déduite des sources [16]

}

export default App;
