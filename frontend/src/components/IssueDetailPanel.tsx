import { X, Copy, Check, Sparkles, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exorcismApi } from '../api/client';

export default function IssueDetailPanel({ issue, onClose, onExorcismComplete }: any) {
  const [copied, setCopied] = useState(false);
  const [isExorcising, setIsExorcising] = useState(false);
  const [exorcismResult, setExorcismResult] = useState<any>(null);
  const [exorcismError, setExorcismError] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExorcise = async () => {
    setIsExorcising(true);
    setExorcismError(null);
    
    try {
      const result = await exorcismApi.exorciseIssue(issue.id);
      setExorcismResult(result.data);
      if (onExorcismComplete) {
        onExorcismComplete(result.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to exorcise issue';
      setExorcismError(errorMessage);
    } finally {
      setIsExorcising(false);
    }
  };

  const canBeExorcised = () => {
    // Ghost hauntings with unused imports/vars can be auto-fixed
    if (issue.hauntingType === 'ghost' && 
        (issue.ruleId.includes('unused-import') || issue.ruleId.includes('unused-var'))) {
      return true;
    }
    // Skeleton hauntings with missing JSDoc can be auto-fixed
    if (issue.hauntingType === 'skeleton' && issue.ruleId.includes('missing-jsdoc')) {
      return true;
    }
    return false;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-haunted-dark rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-haunted-dark border-b border-haunted-gray p-6 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{issue.message}</h2>
              <p className="text-gray-400">
                {issue.filePath}:{issue.startLine}-{issue.endLine}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Severity Badge */}
            <div>
              <span className={`inline-block px-4 py-2 rounded text-sm font-medium ${
                issue.severity === 'critical' ? 'bg-red-900 text-red-200' :
                issue.severity === 'high' ? 'bg-orange-900 text-orange-200' :
                issue.severity === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                'bg-gray-700 text-gray-300'
              }`}>
                {issue.severity.toUpperCase()} SEVERITY
              </span>
            </div>

            {/* Exorcism Success Message */}
            {exorcismResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-300 mb-2">Exorcism Successful!</h4>
                    <p className="text-sm text-green-200 mb-3">
                      A pull request has been created to fix this issue.
                    </p>
                    {exorcismResult.prUrl && (
                      <a
                        href={exorcismResult.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-green-300 hover:text-green-200 transition-colors"
                      >
                        View Pull Request
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Exorcism Error Message */}
            {exorcismError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-300 mb-1">Exorcism Failed</h4>
                    <p className="text-sm text-red-200">{exorcismError}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Exorcise Button */}
            {canBeExorcised() && !exorcismResult && (
              <div className="bg-haunted-darker border border-haunted-gray rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">Auto-Fix Available</h4>
                    <p className="text-sm text-gray-400">
                      This issue can be automatically fixed with a pull request
                    </p>
                  </div>
                  <button
                    onClick={handleExorcise}
                    disabled={isExorcising}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {isExorcising ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exorcising...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Exorcise
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Code Snippet */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Code</h3>
                <button
                  onClick={() => copyToClipboard(issue.codeSnippet)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-haunted-darker p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-300">{issue.codeSnippet}</code>
              </pre>
            </div>

            {/* AI Explanation */}
            {issue.explanation && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Explanation</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {issue.explanation.explanation}
                  </p>
                </div>

                {issue.explanation.fixSuggestion && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">How to Fix</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      {issue.explanation.fixSuggestion}
                    </p>
                    
                    {issue.explanation.codeExample && (
                      <div className="bg-haunted-darker p-4 rounded-lg">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                          {issue.explanation.codeExample}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Rule ID */}
            <div className="pt-4 border-t border-haunted-gray">
              <p className="text-sm text-gray-500">
                Rule: <span className="text-gray-400 font-mono">{issue.ruleId}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
