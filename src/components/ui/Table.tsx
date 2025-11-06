import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function Table<T extends { id: string }>({ columns, data, onEdit, onDelete }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left py-4 px-4 text-sm font-semibold text-slate-700"
              >
                {column.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-8 text-slate-500">
                Aucune donnée disponible
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                {columns.map((column) => (
                  <td key={column.key} className="py-4 px-4 text-sm text-slate-700">
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          Modifier
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          Supprimer
                        </button>
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
  );
}
