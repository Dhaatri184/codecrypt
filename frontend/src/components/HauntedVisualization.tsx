import { useState } from 'react';
import { Ghost, Skull, Droplet, Bone, Bug } from 'lucide-react';
import { motion } from 'framer-motion';
import IssueCard from './IssueCard';
import IssueDetailPanel from './IssueDetailPanel';

const hauntingConfig = {
  ghost: { icon: Ghost, color: 'text-haunted-purple', label: 'Ghosts', description: 'Dead Code' },
  zombie: { icon: Skull, color: 'text-haunted-green', label: 'Zombies', description: 'Deprecated' },
  vampire: { icon: Droplet, color: 'text-haunted-red', label: 'Vampires', description: 'Performance' },
  skeleton: { icon: Bone, color: 'text-gray-400', label: 'Skeletons', description: 'Missing Docs' },
  monster: { icon: Bug, color: 'text-haunted-orange', label: 'Monsters', description: 'Complexity' },
};

export default function HauntedVisualization({ scan, issues }: any) {
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Debug: Log what we received
  console.log('HauntedVisualization received:', { scan, issuesCount: issues?.length, issues: issues?.slice(0, 2) });

  // Handle missing or invalid data
  if (!issues || !Array.isArray(issues)) {
    console.error('Issues is not an array:', issues);
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 text-center">
        <p className="text-red-400 text-xl font-bold mb-2">⚠️ Data Error</p>
        <p className="text-gray-400">Issues data is missing or invalid</p>
        <p className="text-sm text-gray-500 mt-2">Check browser console for details</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="bg-haunted-dark rounded-lg p-8 text-center">
        <p className="text-gray-400 text-xl">🎉 No issues found!</p>
        <p className="text-sm text-gray-500 mt-2">Your code is clean</p>
      </div>
    );
  }

  const issuesByType = issues.reduce((acc: any, issue: any) => {
    acc[issue.hauntingType] = (acc[issue.hauntingType] || 0) + 1;
    return acc;
  }, {});

  const filteredIssues = filterType
    ? issues.filter((issue: any) => issue.hauntingType === filterType)
    : issues;

  const getHauntingLevelColor = (level: string) => {
    if (level === 'Blessed') return 'text-green-400';
    if (level.includes('Mildly')) return 'text-yellow-400';
    if (level.includes('Moderately')) return 'text-orange-400';
    if (level.includes('Heavily')) return 'text-red-400';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Haunting Level Banner */}
      <div className="bg-gradient-to-r from-haunted-dark to-haunted-gray rounded-lg p-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={`text-4xl font-bold mb-2 ${getHauntingLevelColor(scan.hauntingLevel)}`}>
            {scan.hauntingLevel}
          </h2>
          <p className="text-gray-400 text-lg">
            {scan.totalIssues} haunting{scan.totalIssues !== 1 ? 's' : ''} detected in {scan.totalFiles} files
          </p>
        </motion.div>
      </div>

      {/* Haunting Type Icons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(hauntingConfig).map(([type, config]: [string, any], index) => {
          const Icon = config.icon;
          const count = issuesByType[type] || 0;
          const isActive = filterType === type;

          return (
            <motion.button
              key={type}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setFilterType(isActive ? null : type)}
              className={`bg-haunted-dark rounded-lg p-6 text-center hover:bg-haunted-gray transition-all ${
                isActive ? 'ring-2 ring-haunted-purple' : ''
              }`}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, delay: index * 0.5 }}
              >
                <Icon className={`w-12 h-12 mx-auto ${config.color} mb-3`} />
              </motion.div>
              <p className="text-2xl font-bold mb-1">{count}</p>
              <p className="text-sm text-gray-400">{config.label}</p>
              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Issues List Header */}
      <div className="bg-haunted-dark rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">
              {filterType ? (
                <>
                  {hauntingConfig[filterType as keyof typeof hauntingConfig].label} Issues
                  <span className="text-gray-400 text-sm ml-2">({filteredIssues.length} issues)</span>
                </>
              ) : (
                <>
                  All Issues
                  <span className="text-gray-400 text-sm ml-2">({filteredIssues.length} total)</span>
                </>
              )}
            </h3>
            <p className="text-sm text-gray-400">
              {filterType 
                ? `Showing only ${hauntingConfig[filterType as keyof typeof hauntingConfig].label.toLowerCase()}`
                : 'Click on a haunting type above to filter, or browse all issues below'}
            </p>
          </div>
          {filterType && (
            <button
              onClick={() => setFilterType(null)}
              className="bg-haunted-purple hover:bg-haunted-purple-light px-4 py-2 rounded-lg text-sm"
            >
              Show All Issues
            </button>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.map((issue: any, index: number) => (
          <motion.div
            key={issue.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: Math.min(index * 0.05, 2) }}
          >
            <IssueCard issue={issue} onClick={() => setSelectedIssue(issue)} />
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredIssues.length === 0 && (
        <div className="text-center py-12 bg-haunted-dark rounded-lg">
          <p className="text-gray-400">No issues found</p>
        </div>
      )}

      {/* Issue Detail Panel */}
      {selectedIssue && (
        <IssueDetailPanel
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}
