import React, { useState } from 'react';
import { LogIn } from 'lucide-react'; // L'icône Building2 n'est plus nécessaire

// Utilise le contexte d'authentification pour une gestion réelle de la connexion
import { useAuth } from '../../contexts/AuthContext'; // [1]

export function LoginForm() {

    // Initialisation des états [1, 2]
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Récupération de la fonction de connexion (mécanisme de connexion amélioré) [1]
    const { signIn } = useAuth(); // [1]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // [1, 3]
        setError('');
        setLoading(true); // [1, 2]

        try {
            // Tentative de connexion via le contexte [4]
            await signIn(email, password); // [4]
        } catch (err) {
            // Affichage de l'erreur en cas d'échec [3, 4]
            setError('Email ou mot de passe incorrect'); // [3, 4]
        } finally {
            setLoading(false); // [3, 4]
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-2xl space-y-6">
            
            {/* 🖼️ Section Logo et Titre Brandé */}
            <div className="flex flex-col items-center space-y-2">
                
                {/* 🎯 Intégration du Logo */}
                <img 
                    src="public/templates/Logo confort immo archi neutre.png" 
                    alt="Logo Confort Immo Archi" 
                    className="h-16 w-auto mb-2" 
                />
                
                <h1 className="text-3xl font-extrabold tracking-tight">
                    <span className="text-gray-900">
                        CONFORT
                    </span>{' '}
                    <span style={{ 
                        // Application du dégradé de couleur pour le branding (Orange/Or) [3]
                        background: 'linear-gradient(135deg, #F58220 0%, #FFA64D 100%)', // [3]
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        IMMO
                    </span>
                    <span className="text-gray-900">
                        {' '}
                        ARCHI
                    </span> {/* Ajout ARCHI si on suit la source [3] */}
                </h1>
                
                <p className="text-sm text-gray-500 mt-0">
                    Architecture et Immobilier / Gestion immobilière
                </p> {/* Texte inspiré de [3, 4] */}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                
                <h2 className="text-lg font-semibold text-center text-gray-700">
                    Connectez vous a votre Compte
                </h2> {/* Titre du formulaire [5] */}

                {/* Affichage des Erreurs [3, 4] */}
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-lg" role="alert">
                        {error}
                    </div> // [3]
                )}

                {/* 📧 Champ Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        id="email" // [4, 6]
                        type="email" // [4, 6]
                        value={email} // [1, 2]
                        onChange={(e) => setEmail(e.target.value)} // [1, 2]
                        required
                        placeholder="votre@email.com" // [4, 6]
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition" // Styles basés sur [6]
                        // Application de la couleur de focus liée au branding (#F58220) [6]
                        style={{ '--tw-ring-color': '#F58220' } as React.CSSProperties} // [6]
                    />
                </div>

                {/* 🔐 Champ Mot de passe */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                    <input
                        id="password" // [6, 7]
                        type="password" // [6, 7]
                        value={password} // [1, 2]
                        onChange={(e) => setPassword(e.target.value)} // [1, 2]
                        required
                        placeholder="••••••••" // [6, 7]
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition" // [6]
                         // Application de la couleur de focus liée au branding (#F58220) [6]
                        style={{ '--tw-ring-color': '#F58220' } as React.CSSProperties} // [6]
                    />
                </div>

                {/* 🚀 Bouton de Connexion Brandé */}
                <button
                    type="submit" // [7]
                    disabled={loading} // [7, 8]
                    className="w-full text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" // Classes améliorées [8]
                    // Dégradé de couleur du bouton (Orange au Rouge foncé) [8]
                    style={{ background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }} // [8]
                >
                    <LogIn className="inline-block w-5 h-5 mr-2" />
                    {loading ? 'Connexion...' : 'Se connecter'} 
                </button>
            </form>

            {/* Note: La section "Compte de démonstration" a été retirée, conformément à la demande. [8] */}

            {/* Pied de page */}
            <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
                © 2025 Confort Immo Archi. Tous droits réservés. 
            </div>
        </div>
    );
}