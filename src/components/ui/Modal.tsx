import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Fermer avec Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ animation: 'fadeIn 0.2s ease' }}
    >
      {/* Overlay avec backdrop blur */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div 
          className="fixed inset-0 bg-black transition-opacity"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={onClose}
          aria-hidden="true"
        />
        
        {/* Modal Content */}
        <div 
          className={`relative bg-white rounded-2xl shadow-xl w-full p-6 z-10 border-t-4 ${sizeClasses[size]}`}
          style={{ 
            borderTopColor: '#F58220',
            animation: 'modalSlideIn 0.3s ease'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h2 
              id="modal-title"
              className="text-2xl font-bold"
              style={{ color: '#555555' }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all hover:bg-gray-100"
              style={{ color: '#707070' }}
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-content {
          max-height: calc(90vh - 140px);
          overflow-y: auto;
        }

        .modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 4px;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #F58220 0%, #C0392B 100%);
          border-radius: 4px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #E06610 0%, #A93226 100%);
        }
      `}</style>
    </div>
  );
}

// Exemple d'utilisation avec un composant de démonstration
export default function ModalDemo() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [size, setSize] = React.useState<'sm' | 'md' | 'lg' | 'xl'>('md');

  return (
    <div 
      className="min-h-screen p-8"
      style={{ 
        background: 'linear-gradient(to bottom right, #FFF4E6, #FFFFFF, #FFF5F5)' 
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          <span style={{ color: '#C0392B' }}>CONFORT</span>{' '}
          <span style={{ 
            background: 'linear-gradient(135deg, #F58220 0%, #FFA64D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>IMMO</span>{' '}
          <span style={{ color: '#C0392B' }}>ARCHI</span>
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4" style={{ borderTopColor: '#F58220' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#555555' }}>
            Démonstration du Modal
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#555555' }}>
                Taille du modal
              </label>
              <div className="flex gap-2">
                {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      size === s ? 'text-white' : ''
                    }`}
                    style={
                      size === s
                        ? { background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }
                        : { borderWidth: '2px', borderColor: '#F58220', color: '#F58220' }
                    }
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="w-full px-6 py-3 rounded-lg font-bold text-white shadow-lg transition transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }}
            >
              Ouvrir le Modal
            </button>
          </div>
        </div>

        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Ajouter un Bien"
          size={size}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#555555' }}>
                Nom du bien
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
                placeholder="Ex: Appartement Centre-ville"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#555555' }}>
                Type de bien
              </label>
              <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition">
                <option>Appartement</option>
                <option>Maison</option>
                <option>Studio</option>
                <option>Local commercial</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#555555' }}>
                  Surface (m²)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#555555' }}>
                  Loyer mensuel (FCFA)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
                  placeholder="0"
                />
              </div>
            </div>

            <div 
              className="border-l-4 px-4 py-3 rounded"
              style={{ 
                backgroundColor: '#FFF4E6', 
                borderColor: '#F58220', 
                color: '#555555' 
              }}
            >
              <p className="text-sm">
                Assurez-vous que toutes les informations sont correctes avant de valider.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-6 py-3 rounded-lg font-medium border-2 transition"
                style={{ borderColor: '#E5E7EB', color: '#555555' }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert('Bien ajouté avec succès !');
                  setIsOpen(false);
                }}
                className="flex-1 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #F58220 0%, #C0392B 100%)' }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}