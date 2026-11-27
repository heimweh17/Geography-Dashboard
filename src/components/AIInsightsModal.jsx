import WorkspaceDialog from './WorkspaceDialog';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react';

const AIInsightsModal = ({ isOpen, onClose, analysisResult, token, onGenerate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insight, setInsight] = useState(null);

  const handleGenerate = async () => {
    if (!analysisResult) {
      setError('No analysis result available. Please run an analysis first.');
      return;
    }

    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      const result = await onGenerate();
      setInsight(result);
    } catch (err) {
      setError(err?.message || 'Failed to generate insight. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <WorkspaceDialog label="AI insights" size="reading" onClose={onClose}>
      <div className="bg-white dark:bg-forest-950 border border-forest-300 dark:border-forest-800 shadow-2xl w-full max-w-2xl relative rounded-xl overflow-hidden">
        {/* Header */}
        <div className="dialog-heading">
          <div className="flex items-center gap-3">
            <Sparkles className="text-forest-600 dark:text-forest-400" size={24} />
            <div>
              <div className="dialog-title">AI insights</div>
              <div className="text-xs text-forest-700 dark:text-forest-300 opacity-80">
                Limit: 1 insight per user per 7 days
              </div>
            </div>
          </div>
          <button
            autoFocus onClick={onClose}
            className="p-2 rounded-md text-forest-600 hover:text-forest-900 dark:text-forest-300 dark:hover:text-forest-100 hover:bg-forest-100 dark:hover:bg-forest-900"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!analysisResult && (
            <div className="p-4 rounded-lg bg-forest-50 dark:bg-forest-900/40 border border-forest-200 dark:border-forest-700 text-center">
              <p className="text-sm text-forest-900 dark:text-forest-100">
                Run an analysis first to generate insights.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">Error</div>
                  <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
                  {error.includes('429') && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                      You've reached your weekly limit. Please try again in 7 days.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="text-forest-600 dark:text-forest-400 animate-spin" size={32} />
              <p className="text-sm text-forest-700 dark:text-forest-300 mt-4">Generating insight...</p>
            </div>
          )}

          {insight && !loading && (
            <div className="space-y-4">
              {/* Narrative */}
              <div className="p-4 rounded-lg bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700">
                <div className="text-sm font-semibold text-forest-900 dark:text-forest-100 mb-2">
                  Analysis Summary
                </div>
                <p className="text-sm text-forest-800 dark:text-forest-200 leading-relaxed whitespace-pre-wrap break-words">
                  {insight.text || (typeof insight === 'string' ? insight : JSON.stringify(insight, null, 2))}
                </p>
              </div>

              {/* Highlights */}
              {insight.highlights && insight.highlights.length > 0 && (
                <div className="p-4 rounded-lg bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700">
                  <div className="text-sm font-semibold text-forest-900 dark:text-forest-100 mb-3">
                    Key Findings
                  </div>
                  <ul className="space-y-2">
                    {insight.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-forest-600 dark:text-forest-400 mt-1.5">•</span>
                        <span className="text-sm text-forest-800 dark:text-forest-200 flex-1">
                          {highlight}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Method / Assumptions */}
              {(insight.meta?.method || insight.method) && (
                <div className="p-3 rounded-lg bg-mineral-50 dark:bg-mineral-900/40 border border-mineral-200 dark:border-mineral-700">
                  <div className="text-xs font-semibold text-mineral-600 dark:text-mineral-400 mb-1">
                    Method / Assumptions
                  </div>
                  <div className="text-xs text-mineral-700 dark:text-mineral-300">
                    {insight.meta?.method || insight.method}
                  </div>
                </div>
              )}

              {/* Meta info */}
              {insight.meta && (
                <div className="text-xs text-mineral-500 dark:text-mineral-400 text-center pt-2 border-t border-mineral-200 dark:border-mineral-700">
                  Generated using {insight.meta.model || 'UF NaviGator'} • {insight.meta.generated_at ? new Date(insight.meta.generated_at).toLocaleString() : ''}
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          {!loading && !insight && analysisResult && (
            <div className="pt-4">
              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-forest-600 hover:bg-forest-700 dark:bg-forest-700 dark:hover:bg-forest-600 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!token}
              >
                <Sparkles size={18} />
                Generate Insight
              </button>
              {!token && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
                  Please login to generate insights
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </WorkspaceDialog>,
    document.body
  );
};

export default AIInsightsModal;

