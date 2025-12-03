import { Filter, X } from 'lucide-react';
import { HauntingType, Severity, IssueFilters as IssueFiltersType } from '../../hooks/useFilters';

interface IssueFiltersProps {
  filters: IssueFiltersType;
  onHauntingTypesChange: (types: HauntingType[]) => void;
  onSeveritiesChange: (severities: Severity[]) => void;
  onFilePathsChange: (paths: string[]) => void;
  onShowDismissedChange: (show: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  availableFilePaths: string[];
  filteredCount: number;
  totalCount: number;
}

const hauntingTypes: { value: HauntingType; label: string }[] = [
  { value: 'ghost', label: 'Ghost' },
  { value: 'zombie', label: 'Zombie' },
  { value: 'vampire', label: 'Vampire' },
  { value: 'skeleton', label: 'Skeleton' },
  { value: 'monster', label: 'Monster' },
];

const severities: { value: Severity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'bg-red-900 text-red-200' },
  { value: 'high', label: 'High', color: 'bg-orange-900 text-orange-200' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-900 text-yellow-200' },
  { value: 'low', label: 'Low', color: 'bg-gray-700 text-gray-300' },
];

export default function IssueFilters({
  filters,
  onHauntingTypesChange,
  onSeveritiesChange,
  onFilePathsChange,
  onShowDismissedChange,
  onClearFilters,
  hasActiveFilters,
  availableFilePaths,
  filteredCount,
  totalCount,
}: IssueFiltersProps) {
  const toggleHauntingType = (type: HauntingType) => {
    const newTypes = filters.hauntingTypes.includes(type)
      ? filters.hauntingTypes.filter((t) => t !== type)
      : [...filters.hauntingTypes, type];
    onHauntingTypesChange(newTypes);
  };

  const toggleSeverity = (severity: Severity) => {
    const newSeverities = filters.severities.includes(severity)
      ? filters.severities.filter((s) => s !== severity)
      : [...filters.severities, severity];
    onSeveritiesChange(newSeverities);
  };

  const toggleFilePath = (path: string) => {
    const newPaths = filters.filePaths.includes(path)
      ? filters.filePaths.filter((p) => p !== path)
      : [...filters.filePaths, path];
    onFilePathsChange(newPaths);
  };

  return (
    <div className="bg-haunted-dark rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-haunted-purple" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Issue Count */}
      <div className="text-sm text-gray-400">
        Showing <span className="text-white font-medium">{filteredCount}</span> of{' '}
        <span className="text-white font-medium">{totalCount}</span> issues
      </div>

      {/* Haunting Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Haunting Type
        </label>
        <div className="flex flex-wrap gap-2">
          {hauntingTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleHauntingType(type.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                filters.hauntingTypes.includes(type.value)
                  ? 'bg-haunted-purple text-white'
                  : 'bg-haunted-gray text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severity Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Severity
        </label>
        <div className="flex flex-wrap gap-2">
          {severities.map((severity) => (
            <button
              key={severity.value}
              onClick={() => toggleSeverity(severity.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                filters.severities.includes(severity.value)
                  ? severity.color
                  : 'bg-haunted-gray text-gray-400 hover:bg-gray-700'
              }`}
            >
              {severity.label}
            </button>
          ))}
        </div>
      </div>

      {/* File Path Filter */}
      {availableFilePaths.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            File Path
          </label>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {availableFilePaths.slice(0, 20).map((path) => (
              <label
                key={path}
                className="flex items-center gap-2 px-2 py-1 hover:bg-haunted-gray rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.filePaths.includes(path)}
                  onChange={() => toggleFilePath(path)}
                  className="rounded border-gray-600 bg-haunted-gray text-haunted-purple focus:ring-haunted-purple"
                />
                <span className="text-sm text-gray-300 truncate">{path}</span>
              </label>
            ))}
            {availableFilePaths.length > 20 && (
              <p className="text-xs text-gray-500 px-2 py-1">
                + {availableFilePaths.length - 20} more files
              </p>
            )}
          </div>
        </div>
      )}

      {/* Show Dismissed Toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showDismissed}
            onChange={(e) => onShowDismissedChange(e.target.checked)}
            className="rounded border-gray-600 bg-haunted-gray text-haunted-purple focus:ring-haunted-purple"
          />
          <span className="text-sm text-gray-300">Show dismissed issues</span>
        </label>
      </div>
    </div>
  );
}
