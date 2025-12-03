import { Ghost, Skull, Droplet, Bone, Bug, ChevronRight, CheckCircle } from 'lucide-react';

const hauntingIcons = {
  ghost: Ghost,
  zombie: Skull,
  vampire: Droplet,
  skeleton: Bone,
  monster: Bug,
};

const severityColors = {
  critical: 'bg-red-900 text-red-200',
  high: 'bg-orange-900 text-orange-200',
  medium: 'bg-yellow-900 text-yellow-200',
  low: 'bg-gray-700 text-gray-300',
};

export default function IssueCard({ issue, onClick }: any) {
  const Icon = hauntingIcons[issue.hauntingType as keyof typeof hauntingIcons];
  const hasExorcism = issue.exorcism && issue.exorcism.status === 'completed';

  return (
    <button
      onClick={onClick}
      className="w-full bg-haunted-dark hover:bg-haunted-gray p-4 rounded-lg transition-all text-left group"
    >
      <div className="flex items-start gap-4">
        <Icon className="w-6 h-6 flex-shrink-0 mt-1 text-haunted-purple" />
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white mb-1 group-hover:text-haunted-purple transition-colors">
            {issue.message}
          </p>
          <p className="text-sm text-gray-400 truncate">
            {issue.filePath}:{issue.startLine}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {hasExorcism && (
            <span className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-green-900 text-green-200">
              <CheckCircle className="w-3 h-3" />
              Fixed
            </span>
          )}
          <span className={`px-3 py-1 rounded text-xs font-medium ${severityColors[issue.severity as keyof typeof severityColors]}`}>
            {issue.severity}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-haunted-purple transition-colors" />
        </div>
      </div>
    </button>
  );
}
