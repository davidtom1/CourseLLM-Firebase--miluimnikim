'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import type { MessageAnalysis } from '@/shared/types';

type ViewMode = 'live' | 'mock';

export default function IstVisualizerPage() {
  const [analysis, setAnalysis] = useState<MessageAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('mock');
  const [threadId, setThreadId] = useState<string>('demo-thread-cs-demo-101');

  // Fetch mock data
  useEffect(() => {
    if (viewMode !== 'mock') return;

    setLoading(true);
    setError(null);

    // Load mock IST data
    fetch('/mocks/ist/sample-analysis.json')
      .then(async (res) => {
        if (!res.ok) {
          // If sample doesn't exist, create a mock response
          const mockData: MessageAnalysis = {
            intent: {
              labels: ['ASK_EXPLANATION', 'ASK_EXAMPLES'],
              primary: 'ASK_EXPLANATION',
              confidence: 0.92,
            },
            skills: {
              items: [
                { id: 'recursion', displayName: 'Recursion', confidence: 0.88, role: 'FOCUS' },
                { id: 'call-stack', displayName: 'Call Stack', confidence: 0.75, role: 'SECONDARY' },
                { id: 'base-case', displayName: 'Base Case', confidence: 0.82, role: 'PREREQUISITE' },
              ],
            },
            trajectory: {
              currentNodes: ['recursion-basics', 'function-calls'],
              suggestedNextNodes: [
                { id: 'tree-traversal', reason: 'Natural progression from recursion', priority: 1 },
                { id: 'dynamic-programming', reason: 'Advanced application of recursion', priority: 2 },
              ],
              status: 'ON_TRACK',
            },
            metadata: {
              processedAt: new Date().toISOString(),
              modelVersion: 'ist-v1-mock',
              threadId: 'demo-thread',
              messageId: 'mock-msg-001',
              uid: 'mock-user',
            },
          };
          setAnalysis(mockData);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setAnalysis(data);
        setLoading(false);
      })
      .catch((err) => {
        // On error, show inline mock data
        const mockData: MessageAnalysis = {
          intent: {
            labels: ['ASK_EXPLANATION'],
            primary: 'ASK_EXPLANATION',
            confidence: 0.85,
          },
          skills: {
            items: [
              { id: 'arrays', displayName: 'Arrays', confidence: 0.9, role: 'FOCUS' },
              { id: 'big-o', displayName: 'Big O Notation', confidence: 0.7, role: 'SECONDARY' },
            ],
          },
          trajectory: {
            currentNodes: ['data-structures-intro'],
            suggestedNextNodes: [
              { id: 'linked-lists', reason: 'Next topic in sequence', priority: 1 },
            ],
            status: 'ON_TRACK',
          },
          metadata: {
            processedAt: new Date().toISOString(),
            modelVersion: 'ist-v1-fallback',
            threadId: 'demo-thread',
            messageId: 'fallback-msg',
            uid: 'demo-user',
          },
        };
        setAnalysis(mockData);
        setLoading(false);
      });
  }, [viewMode]);

  // Live Firestore subscription
  useEffect(() => {
    if (viewMode !== 'live') return;

    setLoading(true);
    setError(null);

    const analysisRef = collection(db, 'threads', threadId, 'analysis');
    const q = query(analysisRef, orderBy('metadata.processedAt', 'desc'), limit(1));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setLoading(false);
        if (snapshot.empty) {
          setAnalysis(null);
          setError('No analysis documents found for this thread.');
          return;
        }
        const doc = snapshot.docs[0];
        setAnalysis(doc.data() as MessageAnalysis);
        setError(null);
      },
      (err) => {
        setLoading(false);
        setError(`Firestore error: ${err.message}`);
        setAnalysis(null);
      }
    );

    return () => unsubscribe();
  }, [viewMode, threadId]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            IST Visualizer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View raw JSON output from the Intent-Structure-Tagging (IST) analysis engine.
            This page exposes the algorithmic depth of the DSPy service for debugging and verification.
          </p>
        </header>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                View Mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                <option value="mock">Mock Data</option>
                <option value="live">Live Firestore</option>
              </select>
            </div>

            {viewMode === 'live' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thread ID
                </label>
                <input
                  type="text"
                  value={threadId}
                  onChange={(e) => setThreadId(e.target.value)}
                  placeholder="Enter thread ID..."
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        {loading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-700 dark:text-blue-300">Loading analysis...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Analysis Display */}
        {analysis && (
          <div className="space-y-6">
            {/* Intent Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                Intent
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Primary</div>
                  <div className="text-lg font-mono font-semibold text-purple-600 dark:text-purple-400">
                    {analysis.intent.primary}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Confidence</div>
                  <div className="text-lg font-mono font-semibold">
                    {(analysis.intent.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">All Labels</div>
                  <div className="text-sm font-mono">
                    {analysis.intent.labels.join(', ')}
                  </div>
                </div>
              </div>
            </section>

            {/* Skills Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Skills (Structure)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Skill ID</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Display Name</th>
                      <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">Confidence</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.skills.items.map((skill, idx) => (
                      <tr key={idx} className="border-b dark:border-gray-700 last:border-0">
                        <td className="py-2 px-3 font-mono text-xs">{skill.id}</td>
                        <td className="py-2 px-3">{skill.displayName || skill.id}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {(skill.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            skill.role === 'FOCUS' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            skill.role === 'SECONDARY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            skill.role === 'PREREQUISITE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {skill.role || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Trajectory Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                Trajectory (Tagging)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Status</div>
                  <div className={`text-lg font-semibold ${
                    analysis.trajectory.status === 'ON_TRACK' ? 'text-green-600 dark:text-green-400' :
                    analysis.trajectory.status === 'STRUGGLING' ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {analysis.trajectory.status}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Current Nodes</div>
                  <div className="text-sm font-mono">
                    {analysis.trajectory.currentNodes.join(', ') || 'None'}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suggested Next Nodes
                </h3>
                <div className="space-y-2">
                  {analysis.trajectory.suggestedNextNodes.map((node, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded p-3 flex items-start gap-3">
                      <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-xs font-medium">
                        #{node.priority || idx + 1}
                      </span>
                      <div>
                        <div className="font-mono text-sm">{node.id}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{node.reason || 'No reason provided'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Metadata Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                Metadata
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Processed At</div>
                  <div className="font-mono">{new Date(analysis.metadata.processedAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Model Version</div>
                  <div className="font-mono">{analysis.metadata.modelVersion}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Thread ID</div>
                  <div className="font-mono text-xs break-all">{analysis.metadata.threadId}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Message ID</div>
                  <div className="font-mono text-xs break-all">{analysis.metadata.messageId || 'N/A'}</div>
                </div>
              </div>
            </section>

            {/* Raw JSON Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Raw JSON
              </h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

