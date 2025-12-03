import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient, { scanApi } from '../api/client';
import HauntedVisualization from '../components/HauntedVisualization';
import { useWebSocket } from '../hooks/useWebSocket';
import CustomSelect from '../components/CustomSelect';
import { ScanProgress } from '../components/ScanProgress';

export default function Dashboard() {
  const { logout } = useAuth();
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [autoShowedResults, setAutoShowedResults] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: repos, isLoading: reposLoading } = useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/repositories');
      return data.data;
    },
  });

  const { data: githubRepos, isLoading: githubReposLoading, error: githubReposError } = useQuery({
    queryKey: ['github-repositories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/repositories/github');
      return data.data;
    },
    enabled: showConnectModal,
    retry: false,
  });

  const connectRepo = useMutation({
    mutationFn: async (repo: any) => {
      const { data } = await apiClient.post('/repositories/connect', {
        githubRepoId: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        cloneUrl: repo.clone_url,
        defaultBranch: repo.default_branch,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      setShowConnectModal(false);
    },
  });

  const { data: scans, refetch: refetchScans } = useQuery({
    queryKey: ['scans', selectedRepo?.id],
    queryFn: async () => {
      const { data} = await apiClient.get(`/scans/repository/${selectedRepo.id}`);
      return data.data;
    },
    enabled: !!selectedRepo,
    // Poll every 2 seconds if there's an active scan
    refetchInterval: (data) => {
      const hasActiveScan = data?.some((scan: any) => 
        ['pending', 'scanning', 'analyzing'].includes(scan.status)
      );
      return hasActiveScan ? 2000 : false;
    },
  });

  const { data: scanResults, isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ['scanResults', selectedScanId || scans?.[0]?.id],
    queryFn: async () => {
      const scanId = selectedScanId || scans?.[0]?.id;
      console.log('Fetching scan results for:', scanId);
      const { data } = await apiClient.get(`/scans/${scanId}/results`, {
        timeout: 30000, // 30 second timeout
      });
      console.log('Scan results loaded:', data.data);
      console.log('Number of issues:', data.data?.issues?.length);
      return data.data;
    },
    enabled: !!(selectedScanId || (scans?.[0]?.id && scans[0].status === 'completed')),
    retry: 2, // Only retry twice
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Auto-show results when latest scan completes (using useEffect)
  const latestScan = scans?.[0];
  
  // Use useEffect to handle auto-showing results
  React.useEffect(() => {
    if (latestScan?.status === 'completed' && latestScan.id !== autoShowedResults && !selectedScanId) {
      setAutoShowedResults(latestScan.id);
      setSelectedScanId(latestScan.id);
      setTimeout(() => {
        const resultsElement = document.querySelector('[data-results]');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [latestScan?.id, latestScan?.status, autoShowedResults, selectedScanId]);

  const triggerScan = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/scans', {
        repositoryId: selectedRepo.id,
      });
      return data.data;
    },
    onSuccess: () => {
      setTimeout(() => refetchScans(), 2000);
    },
  });

  // WebSocket handlers
  const handleScanUpdate = useCallback((data: any) => {
    console.log('Scan update received:', data);
    // Refetch scans to get updated status
    queryClient.invalidateQueries({ queryKey: ['scans', selectedRepo?.id] });
  }, [queryClient, selectedRepo?.id]);

  const handleScanProgress = useCallback((data: any) => {
    console.log('Scan progress received:', data);
    // Update scan progress in real-time
    queryClient.setQueryData(['scans', selectedRepo?.id], (old: any) => {
      if (!old) return old;
      return old.map((scan: any) => 
        scan.id === data.payload.scanId 
          ? { 
              ...scan, 
              progressPercentage: data.payload.progressPercentage,
              filesProcessed: data.payload.filesProcessed,
              totalFilesDiscovered: data.payload.totalFiles,
              currentStatusMessage: data.payload.statusMessage,
            }
          : scan
      );
    });
  }, [queryClient, selectedRepo?.id]);

  const handleScanComplete = useCallback((data: any) => {
    console.log('Scan complete:', data);
    // Refetch both scans and results
    queryClient.invalidateQueries({ queryKey: ['scans', selectedRepo?.id] });
    queryClient.invalidateQueries({ queryKey: ['scanResults'] });
  }, [queryClient, selectedRepo?.id]);

  const handleScanCancelled = useCallback((data: any) => {
    console.log('Scan cancelled:', data);
    // Refetch scans to show cancelled state
    queryClient.invalidateQueries({ queryKey: ['scans', selectedRepo?.id] });
  }, [queryClient, selectedRepo?.id]);

  const handleScanError = useCallback((data: any) => {
    console.error('Scan error:', data);
    // Refetch scans to show error state
    queryClient.invalidateQueries({ queryKey: ['scans', selectedRepo?.id] });
  }, [queryClient, selectedRepo?.id]);

  // Cancel scan handler
  const handleCancelScan = useCallback(async (scanId: string) => {
    if (window.confirm('Are you sure you want to cancel this scan?')) {
      try {
        await scanApi.cancelScan(scanId);
        queryClient.invalidateQueries({ queryKey: ['scans', selectedRepo?.id] });
      } catch (error) {
        console.error('Failed to cancel scan:', error);
        alert('Failed to cancel scan. Please try again.');
      }
    }
  }, [queryClient, selectedRepo?.id]);

  // Initialize WebSocket connection
  useWebSocket({
    repositoryId: selectedRepo?.id,
    onScanUpdate: handleScanUpdate,
    onScanProgress: handleScanProgress,
    onScanComplete: handleScanComplete,
    onScanCancelled: handleScanCancelled,
    onScanError: handleScanError,
  });

  return (
    <div className="min-h-screen bg-haunted-darker">
      {/* Header */}
      <header className="bg-haunted-dark border-b border-haunted-gray p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Code<span className="text-haunted-purple">Crypt</span>
          </h1>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto p-8">
        {/* Repository Selector */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Select Repository</label>
            <button
              onClick={() => setShowConnectModal(true)}
              className="text-sm bg-haunted-purple hover:bg-haunted-purple-light px-4 py-2 rounded-lg"
            >
              + Connect Repository
            </button>
          </div>
          <div className="flex gap-4">
            <CustomSelect
              className="flex-1"
              options={[
                { value: '', label: 'Choose a repository...' },
                ...(repos?.map((repo: any) => ({
                  value: repo.id,
                  label: repo.fullName
                })) || [])
              ]}
              value={selectedRepo?.id || ''}
              onChange={(value) => {
                const repo = repos?.find((r: any) => r.id === value);
                setSelectedRepo(repo);
              }}
              placeholder="Choose a repository..."
            />
            
            {selectedRepo && (
              <button
                onClick={() => triggerScan.mutate()}
                disabled={triggerScan.isPending}
                className="bg-haunted-purple hover:bg-haunted-purple-light px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${triggerScan.isPending ? 'animate-spin' : ''}`} />
                Scan
              </button>
            )}
          </div>
        </div>

        {/* Connect Repository Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-haunted-dark rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Connect Repository</h2>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {githubReposLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-haunted-purple mx-auto"></div>
                  <p className="mt-4 text-gray-400">Loading your GitHub repositories...</p>
                </div>
              ) : githubReposError ? (
                <div className="text-center py-12">
                  <div className="text-red-400 mb-4">
                    <p className="text-lg font-semibold">Unable to fetch GitHub repositories</p>
                    <p className="text-sm mt-2">This might be due to an expired authentication token.</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      window.location.href = '/login';
                    }}
                    className="bg-haunted-purple hover:bg-haunted-purple-light px-6 py-3 rounded-lg"
                  >
                    Log in again to refresh access
                  </button>
                </div>
              ) : !githubRepos || githubRepos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">No GitHub repositories found</p>
                  <p className="text-sm text-gray-500">Make sure you have repositories in your GitHub account</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {githubRepos.map((repo: any) => {
                    const isConnected = repos?.some((r: any) => r.githubRepoId === repo.id.toString());
                    return (
                      <div
                        key={repo.id}
                        className="flex justify-between items-center p-4 bg-haunted-darker rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{repo.full_name}</p>
                          <p className="text-sm text-gray-400">{repo.description || 'No description'}</p>
                        </div>
                        <button
                          onClick={() => connectRepo.mutate(repo)}
                          disabled={isConnected || connectRepo.isPending}
                          className={`px-4 py-2 rounded-lg ${
                            isConnected
                              ? 'bg-gray-600 cursor-not-allowed'
                              : 'bg-haunted-purple hover:bg-haunted-purple-light'
                          }`}
                        >
                          {isConnected ? 'Connected' : 'Connect'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {reposLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-haunted-purple mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading repositories...</p>
          </div>
        )}

        {/* No Repositories State */}
        {!reposLoading && repos?.length === 0 && (
          <div className="text-center py-12 bg-haunted-dark rounded-lg">
            <p className="text-xl mb-4">👻 No repositories connected yet</p>
            <p className="text-gray-400 mb-6">Connect a repository from GitHub to start scanning for hauntings</p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="bg-haunted-purple hover:bg-haunted-purple-light px-6 py-3 rounded-lg"
            >
              Connect Your First Repository
            </button>
          </div>
        )}

        {/* Scan History & Active Scans */}
        {selectedRepo && scans && scans.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Scan History ({scans.length} total)
              </h2>
            </div>

            {/* Active Scan Progress */}
            {scans[0] && ['pending', 'scanning', 'analyzing'].includes(scans[0].status) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-purple-400">🔄 Active Scan</h3>
                <ScanProgress
                  scanId={scans[0].id}
                  status={scans[0].status}
                  progressPercentage={scans[0].progressPercentage || 0}
                  filesProcessed={scans[0].filesProcessed || 0}
                  totalFiles={scans[0].totalFilesDiscovered || 0}
                  statusMessage={scans[0].currentStatusMessage}
                  onCancel={() => handleCancelScan(scans[0].id)}
                />
              </div>
            )}

            {/* Recent Scans List */}
            <div className="bg-haunted-dark rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Recent Scans</h3>
              <div className="space-y-2">
                {scans.slice(0, 5).map((scan: any, index: number) => (
                  <div
                    key={scan.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-haunted-darker border border-purple-500' : 'bg-haunted-darker'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {scan.status === 'completed' && <span className="text-2xl">✅</span>}
                        {scan.status === 'failed' && <span className="text-2xl">❌</span>}
                        {scan.status === 'cancelled' && <span className="text-2xl">⚠️</span>}
                        {['pending', 'scanning', 'analyzing'].includes(scan.status) && (
                          <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                        )}
                      </div>

                      {/* Scan Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{scan.status}</span>
                          {index === 0 && <span className="text-xs bg-purple-600 px-2 py-1 rounded">Latest</span>}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {scan.status === 'completed' && (
                            <>
                              {scan.totalFiles || 0} files • {scan.totalIssues || 0} issues • {scan.hauntingLevel || 'Unknown'}
                            </>
                          )}
                          {['scanning', 'analyzing'].includes(scan.status) && (
                            <>
                              {scan.filesProcessed || 0} of {scan.totalFilesDiscovered || 0} files • {scan.progressPercentage || 0}%
                            </>
                          )}
                          {scan.status === 'pending' && <>Waiting to start...</>}
                          {scan.status === 'failed' && <>Scan failed</>}
                          {scan.status === 'cancelled' && <>Cancelled by user</>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(scan.startedAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0">
                        {['scanning', 'analyzing'].includes(scan.status) && (
                          <button
                            onClick={() => handleCancelScan(scan.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                          >
                            🛑 Stop
                          </button>
                        )}
                        {scan.status === 'completed' && (
                          <button
                            onClick={() => {
                              console.log('View Results clicked for scan:', scan.id);
                              console.log('Scan has files:', scan.totalFiles);
                              console.log('Scan has issues:', scan.totalIssues);
                              // Set this scan as selected to load its results
                              setSelectedScanId(scan.id);
                              // Scroll to results
                              setTimeout(() => {
                                const resultsElement = document.querySelector('[data-results]');
                                if (resultsElement) {
                                  resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                } else {
                                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                }
                              }, 300);
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                          >
                            View Results
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {scanResults && (
          <div data-results className="mt-8">
            <div className="mb-6 p-6 bg-gradient-to-r from-haunted-purple/20 to-haunted-dark rounded-lg border-2 border-haunted-purple">
              <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
                👻 Scan Results
                <span className="text-sm font-normal text-gray-400">
                  (Scan ID: {scanResults.scan?.id?.slice(0, 8)}...)
                </span>
              </h2>
              <p className="text-gray-300 text-lg">
                Found <span className="text-haunted-purple font-bold">{scanResults.issues?.length || 0}</span> haunting{scanResults.issues?.length !== 1 ? 's' : ''} in <span className="text-haunted-purple font-bold">{scanResults.scan?.totalFiles || 0}</span> files
              </p>
              {scanResults.scan?.completedAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Completed: {new Date(scanResults.scan.completedAt).toLocaleString()}
                </p>
              )}
              {/* Debug info */}
              {(!scanResults.issues || scanResults.issues.length === 0) && (
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500 rounded">
                  <p className="text-yellow-400 font-bold">⚠️ Debug Info:</p>
                  <p className="text-sm text-gray-400 mt-2">
                    scanResults keys: {Object.keys(scanResults).join(', ')}
                  </p>
                  <p className="text-sm text-gray-400">
                    issues type: {typeof scanResults.issues}
                  </p>
                  <p className="text-sm text-gray-400">
                    issues is array: {Array.isArray(scanResults.issues) ? 'yes' : 'no'}
                  </p>
                </div>
              )}
            </div>
            {scanResults.issues && Array.isArray(scanResults.issues) && scanResults.issues.length > 0 ? (
              <HauntedVisualization
                scan={scanResults.scan}
                issues={scanResults.issues}
              />
            ) : (
              <div className="bg-haunted-dark rounded-lg p-8 text-center">
                <p className="text-red-400 text-xl font-bold mb-2">No Issues Data</p>
                <p className="text-gray-400">The scan completed but no issues were returned</p>
                <button
                  onClick={() => console.log('Full scanResults:', scanResults)}
                  className="mt-4 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                >
                  Log Full Data to Console
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Loading Results */}
        {selectedScanId && resultsLoading && !scanResults && (
          <div data-results className="text-center py-12 bg-haunted-dark rounded-lg mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-haunted-purple mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading scan results...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a moment for large scans</p>
          </div>
        )}
        
        {/* Error Loading Results */}
        {selectedScanId && resultsError && !scanResults && (
          <div data-results className="text-center py-12 bg-haunted-dark rounded-lg mt-8 border-2 border-red-500">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <p className="text-xl font-bold text-red-400 mb-2">Failed to Load Results</p>
            <p className="text-gray-400 mb-4">
              {(() => {
                const err = resultsError as any;
                if (err?.response?.data?.error?.message) {
                  return err.response.data.error.message;
                }
                if (err?.response?.status === 401) {
                  return 'Authentication expired. Please log in again.';
                }
                if (err?.response?.status === 403) {
                  return 'You do not have access to this scan.';
                }
                if (err?.response?.status === 404) {
                  return 'Scan not found.';
                }
                if (err?.code === 'ECONNABORTED') {
                  return 'Request timed out. The scan has too many issues to load quickly.';
                }
                if (err?.message) {
                  return err.message;
                }
                return 'Unknown error occurred. Check browser console for details.';
              })()}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  console.log('Retrying scan results fetch...');
                  queryClient.invalidateQueries({ queryKey: ['scanResults', selectedScanId] });
                }}
                className="bg-haunted-purple hover:bg-haunted-purple-light px-6 py-3 rounded-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  console.log('Full error:', resultsError);
                  alert('Error details logged to console. Press F12 to view.');
                }}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg"
              >
                Show Error Details
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedRepo && !scans?.length && !triggerScan.isPending && (
          <div className="text-center py-12 bg-haunted-dark rounded-lg">
            <p className="text-gray-400 mb-4">No scans yet for this repository</p>
            <button
              onClick={() => triggerScan.mutate()}
              className="bg-haunted-purple hover:bg-haunted-purple-light px-6 py-3 rounded-lg"
            >
              Run First Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
