import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

// ==================== TYPES ====================

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  searchable?: boolean;
  striped?: boolean;
}

// ==================== CONSTANTES ====================

const BRAND_COLORS = {
  primary: '#F58220',
  primaryLight: '#FFA64D',
  primaryDark: '#E06610',
  red: '#C0392B',
  redLight: '#E74C3C',
  gray: '#555555',
  grayLight: '#707070',
  grayBg: '#F9FAFB',
};

// ==================== COMPOSANTS ====================

/**
 * État de chargement avec skeleton
 */
const LoadingSkeleton = ({ columns }: { columns: number }) => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="border-b border-gray-100">
        {Array.from({ length: columns }).map((_, j) => (
          <td key={j} className="py-4 px-4">
            <div 
              className="h-4 rounded animate-pulse"
              style={{ backgroundColor: '#E5E7EB', width: `${60 + Math.random() * 40}%` }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/**
 * Message d'état vide
 */
const EmptyState = ({ message, colSpan }: { message: string; colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center opacity-20"
          style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.red} 100%)` }}
        >
          <Filter className="w-8 h-8 text-white" />
        </div>
        <p style={{ color: BRAND_COLORS.grayLight }}>{message}</p>
      </div>
    </td>
  </tr>
);

/**
 * Bouton d'action
 */
interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: 'edit' | 'delete' | 'view';
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon, label, variant }) => {
  const styles = {
    edit: {
      bg: 'rgba(245, 130, 32, 0.1)',
      hoverBg: 'rgba(245, 130, 32, 0.2)',
      color: BRAND_COLORS.primaryDark,
    },
    delete: {
      bg: '#FEE2E2',
      hoverBg: '#FECACA',
      color: '#991B1B',
    },
    view: {
      bg: '#F3F4F6',
      hoverBg: '#E5E7EB',
      color: BRAND_COLORS.gray,
    },
  };

  const style = styles[variant];

  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg transition-all transform hover:scale-105"
      style={{ backgroundColor: style.bg, color: style.color }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = style.hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = style.bg)}
      title={label}
    >
      {icon}
    </button>
  );
};

/**
 * En-tête de colonne avec tri
 */
interface TableHeaderProps {
  column: Column<any>;
  sortKey: string | null;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ column, sortKey, sortOrder, onSort }) => {
  const isSorted = sortKey === column.key;

  return (
    <th
      className={`text-left py-4 px-4 text-sm font-semibold ${column.sortable ? 'cursor-pointer select-none' : ''}`}
      style={{ 
        color: BRAND_COLORS.gray,
        width: column.width,
        backgroundColor: BRAND_COLORS.grayBg,
      }}
      onClick={() => column.sortable && onSort(column.key)}
    >
      <div className="flex items-center gap-2">
        <span>{column.label}</span>
        {column.sortable && (
          <div className="flex flex-col">
            {isSorted && sortOrder === 'asc' ? (
              <ChevronUp className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
            ) : isSorted && sortOrder === 'desc' ? (
              <ChevronDown className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
            ) : (
              <div className="flex flex-col opacity-30">
                <ChevronUp className="w-3 h-3 -mb-1" style={{ color: BRAND_COLORS.gray }} />
                <ChevronDown className="w-3 h-3" style={{ color: BRAND_COLORS.gray }} />
              </div>
            )}
          </div>
        )}
      </div>
    </th>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================

export function Table<T extends { id: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  pageSize = 10,
  searchable = true,
  striped = false,
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Tri
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filtrage et tri des données
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Recherche
    if (searchTerm && searchable) {
      filtered = filtered.filter((item) =>
        columns.some((col) => {
          const value = (item as any)[col.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Tri
    if (sortKey) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];

        if (aVal === bVal) return 0;
        
        const comparison = aVal > bVal ? 1 : -1;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortKey, sortOrder, columns, searchable]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasActions = onEdit || onDelete || onView;
  const totalColumns = columns.length + (hasActions ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      {searchable && (
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" 
            style={{ color: BRAND_COLORS.grayLight }}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition"
            style={{
              borderColor: searchTerm ? BRAND_COLORS.primary : '#E5E7EB',
            }}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2" style={{ borderColor: BRAND_COLORS.primary }}>
                {columns.map((column) => (
                  <TableHeader
                    key={column.key}
                    column={column}
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                ))}
                {hasActions && (
                  <th 
                    className="text-right py-4 px-4 text-sm font-semibold"
                    style={{ color: BRAND_COLORS.gray, backgroundColor: BRAND_COLORS.grayBg }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingSkeleton columns={totalColumns} />
              ) : paginatedData.length === 0 ? (
                <EmptyState message={emptyMessage} colSpan={totalColumns} />
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    style={striped && index % 2 === 1 ? { backgroundColor: '#F9FAFB' } : {}}
                  >
                    {columns.map((column) => (
                      <td 
                        key={column.key} 
                        className="py-4 px-4 text-sm"
                        style={{ color: BRAND_COLORS.gray }}
                      >
                        {column.render ? column.render(item) : (item as any)[column.key]}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {onView && (
                            <ActionButton
                              onClick={() => onView(item)}
                              icon={<Search className="w-4 h-4" />}
                              label="Voir"
                              variant="view"
                            />
                          )}
                          {onEdit && (
                            <ActionButton
                              onClick={() => onEdit(item)}
                              icon={<Edit2 className="w-4 h-4" />}
                              label="Modifier"
                              variant="edit"
                            />
                          )}
                          {onDelete && (
                            <ActionButton
                              onClick={() => onDelete(item)}
                              icon={<Trash2 className="w-4 h-4" />}
                              label="Supprimer"
                              variant="delete"
                            />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm" style={{ color: BRAND_COLORS.grayLight }}>
              Affichage de {(currentPage - 1) * pageSize + 1} à{' '}
              {Math.min(currentPage * pageSize, processedData.length)} sur {processedData.length}{' '}
              résultats
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: currentPage === 1 ? '#E5E7EB' : BRAND_COLORS.primary,
                  color: currentPage === 1 ? BRAND_COLORS.grayLight : BRAND_COLORS.primary,
                }}
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: currentPage === totalPages ? '#E5E7EB' : BRAND_COLORS.primary,
                  color: currentPage === totalPages ? BRAND_COLORS.grayLight : BRAND_COLORS.primary,
                }}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== DÉMO ====================
export default function TableDemo() {
  const sampleData = [
    { id: '1', nom: 'Immeuble Centre-Ville', adresse: '15 Rue de la République, Dakar', unites: 12, loyer: 1250000 },
    { id: '2', nom: 'Résidence Almadies', adresse: 'Route des Almadies, Dakar', unites: 8, loyer: 2500000 },
    { id: '3', nom: 'Villa Mermoz', adresse: 'Mermoz, Dakar', unites: 4, loyer: 1800000 },
    { id: '4', nom: 'Complexe Ouakam', adresse: 'Ouakam, Dakar', unites: 20, loyer: 3200000 },
    { id: '5', nom: 'Appartements Plateau', adresse: 'Plateau, Dakar', unites: 15, loyer: 2100000 },
  ];

  const columns: Column<typeof sampleData[0]>[] = [
    { 
      key: 'nom', 
      label: 'Nom de l\'immeuble', 
      sortable: true,
      width: '25%'
    },
    { 
      key: 'adresse', 
      label: 'Adresse', 
      sortable: true,
      width: '35%'
    },
    { 
      key: 'unites', 
      label: 'Unités', 
      sortable: true,
      render: (item) => (
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#FFF4E6', color: BRAND_COLORS.primaryDark }}
        >
          {item.unites} unités
        </span>
      ),
      width: '15%'
    },
    { 
      key: 'loyer', 
      label: 'Loyer total', 
      sortable: true,
      render: (item) => (
        <span className="font-semibold" style={{ color: BRAND_COLORS.primary }}>
          {item.loyer.toLocaleString()} FCFA
        </span>
      ),
      width: '25%'
    },
  ];

  return (
    <div 
      className="min-h-screen p-8"
      style={{ background: 'linear-gradient(to bottom right, #FFF4E6, #FFFFFF, #FFF5F5)' }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span style={{ color: BRAND_COLORS.red }}>CONFORT</span>{' '}
            <span style={{ 
              background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryLight} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>IMMO</span>{' '}
            <span style={{ color: BRAND_COLORS.red }}>ARCHI</span>
          </h1>
          <p style={{ color: BRAND_COLORS.grayLight }}>Tableau de gestion des immeubles</p>
        </div>

        <Table
          columns={columns}
          data={sampleData}
          onView={(item) => alert(`Voir: ${item.nom}`)}
          onEdit={(item) => alert(`Modifier: ${item.nom}`)}
          onDelete={(item) => alert(`Supprimer: ${item.nom}`)}
          searchable={true}
          pageSize={10}
          striped={false}
        />
      </div>
    </div>
  );
}