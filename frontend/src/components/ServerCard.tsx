import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  EyeIcon,
  WrenchScrewdriverIcon,
  StarIcon,
  ArrowPathIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

interface Server {
  name: string;
  path: string;
  description?: string;
  official?: boolean;
  enabled: boolean;
  tags?: string[];
  last_checked_time?: string;
  usersCount?: number;
  rating?: number;
  status?: 'healthy' | 'unhealthy' | 'unknown';
  num_tools?: number;
}

interface ServerCardProps {
  server: Server;
  onToggle: (path: string, enabled: boolean) => void;
  onEdit?: (server: Server) => void;
  canModify?: boolean;
  onRefreshSuccess?: () => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  onServerUpdate?: (path: string, updates: Partial<Server>) => void;

}

interface Tool {
  name: string;
  description?: string;
  schema?: any;
}

// Helper function to format time since last checked
const formatTimeSince = (timestamp: string | null | undefined): string | null => {
  if (!timestamp) {
    console.log('🕐 formatTimeSince: No timestamp provided', timestamp);
    return null;
  }
  
  try {
    const now = new Date();
    const lastChecked = new Date(timestamp);
    
    // Check if the date is valid
    if (isNaN(lastChecked.getTime())) {
      console.log('🕐 formatTimeSince: Invalid timestamp', timestamp);
      return null;
    }
    
    const diffMs = now.getTime() - lastChecked.getTime();
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    let result;
    if (diffDays > 0) {
      result = `${diffDays}d ago`;
    } else if (diffHours > 0) {
      result = `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      result = `${diffMinutes}m ago`;
    } else {
      result = `${diffSeconds}s ago`;
    }
    
    console.log(`🕐 formatTimeSince: ${timestamp} -> ${result}`);
    return result;
  } catch (error) {
    console.error('🕐 formatTimeSince error:', error, 'for timestamp:', timestamp);
    return null;
  }
};

const ServerCard: React.FC<ServerCardProps> = ({ server, onToggle, onEdit, canModify, onRefreshSuccess, onShowToast, onServerUpdate }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);

  const getStatusIcon = () => {
    switch (server.status) {
      case 'healthy':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (server.status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleViewTools = useCallback(async () => {
    if (loadingTools) return;
    
    setLoadingTools(true);
    try {
      const response = await axios.get(`/api/tools${server.path}`);
      setTools(response.data.tools || []);
      setShowTools(true);
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      if (onShowToast) {
        onShowToast('Failed to fetch tools', 'error');
      }
    } finally {
      setLoadingTools(false);
    }
  }, [server.path, loadingTools, onShowToast]);

  const handleRefreshHealth = useCallback(async () => {
    if (loadingRefresh) return;
    
    setLoadingRefresh(true);
    try {
      // Extract service name from path (remove leading slash)
      const serviceName = server.path.replace(/^\//, '');
      
      const response = await axios.post(`/api/refresh/${serviceName}`);
      
      // Update just this server instead of triggering global refresh
      if (onServerUpdate && response.data) {
        const updates: Partial<Server> = {
          status: response.data.status === 'healthy' ? 'healthy' : 
                  response.data.status === 'unhealthy' ? 'unhealthy' : 'unknown',
          last_checked_time: response.data.last_checked_iso,
          num_tools: response.data.num_tools
        };
        
        onServerUpdate(server.path, updates);
      } else if (onRefreshSuccess) {
        // Fallback to global refresh if onServerUpdate is not provided
        onRefreshSuccess();
      }
      
      if (onShowToast) {
        onShowToast('Health status refreshed successfully', 'success');
      }
    } catch (error: any) {
      console.error('Failed to refresh health:', error);
      if (onShowToast) {
        onShowToast(error.response?.data?.detail || 'Failed to refresh health status', 'error');
      }
    } finally {
      setLoadingRefresh(false);
    }
  }, [server.path, loadingRefresh, onRefreshSuccess, onShowToast, onServerUpdate]);

  return (
    <>
      <div className="group bg-white dark:bg-gray-800 rounded-lg border-t-4 border-primary-700 border-r border-b border-l border-gray-100 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {server.name}
                </h3>
                {server.official && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full flex-shrink-0">
                    OFFICIAL
                  </span>
                )}
              </div>
              
              <code className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded font-mono">
                {server.path}
              </code>
            </div>

            {canModify && (
              <button
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 flex-shrink-0"
                onClick={() => onEdit?.(server)}
                title="Edit server"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4">
            {server.description || 'No description available'}
          </p>

          {/* Tags */}
          {server.tags && server.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {server.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded"
                >
                  #{tag}
                </span>
              ))}
              {server.tags.length > 3 && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
                  +{server.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                <StarIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{server.rating || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(server.num_tools || 0) > 0 ? (
                <button
                  onClick={handleViewTools}
                  disabled={loadingTools}
                  className="flex items-center gap-2 text-primary-700 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-2 py-1 -mx-2 -my-1 rounded transition-all"
                  title="View tools"
                >
                  <div className="p-1.5 bg-primary-50 dark:bg-primary-900/30 rounded">
                    <WrenchScrewdriverIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{server.num_tools}</div>
                    <div className="text-xs">Tools</div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                  <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                    <WrenchScrewdriverIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{server.num_tools || 0}</div>
                    <div className="text-xs">Tools</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  server.enabled 
                    ? 'bg-green-400 shadow-lg shadow-green-400/30' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {server.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  server.status === 'healthy' 
                    ? 'bg-emerald-400 shadow-lg shadow-emerald-400/30'
                    : server.status === 'unhealthy'
                    ? 'bg-red-400 shadow-lg shadow-red-400/30'
                    : 'bg-amber-400 shadow-lg shadow-amber-400/30'
                }`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {server.status === 'healthy' ? 'Healthy' : 
                   server.status === 'unhealthy' ? 'Unhealthy' : 'Unknown'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Last Checked */}
              {(() => {
                console.log(`🕐 ServerCard ${server.name}: last_checked_time =`, server.last_checked_time);
                const timeText = formatTimeSince(server.last_checked_time);
                console.log(`🕐 ServerCard ${server.name}: timeText =`, timeText);
                return server.last_checked_time && timeText ? (
                  <div className="text-xs text-gray-500 dark:text-gray-300 flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5" />
                    <span>{timeText}</span>
                  </div>
                ) : null;
              })()}

              {/* Refresh Button */}
              <button
                onClick={handleRefreshHealth}
                disabled={loadingRefresh}
                className="p-2.5 text-gray-500 hover:text-primary-700 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                title="Refresh health status"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loadingRefresh ? 'animate-spin' : ''}`} />
              </button>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={server.enabled}
                  onChange={(e) => onToggle(server.path, e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                  server.enabled 
                    ? 'bg-primary-700' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                    server.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Modal */}
      {showTools && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg border-t-4 border-primary-700 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto shadow-xl animate-fly-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-400">
                Tools for {server.name}
              </h3>
              <button
                onClick={() => setShowTools(false)}
                className="text-gray-500 hover:text-primary-700 dark:text-gray-400 dark:hover:text-primary-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {tools.length > 0 ? (
                tools.map((tool, index) => (
                  <div key={index} className="border-l-4 border-primary-500 border-t border-r border-b border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-primary-700 dark:text-primary-400 mb-2">
                      {tool.name}
                    </h4>
                    {tool.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {tool.description}
                      </p>
                    )}
                    {tool.schema && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                          View Schema
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded overflow-x-auto text-gray-900 dark:text-gray-100">
                          {JSON.stringify(tool.schema, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-300">No tools available for this server.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServerCard; 