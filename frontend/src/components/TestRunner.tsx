import React, { useState } from 'react';
import { useApiStore } from '../stores/apiStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import {
  Play, Loader2, Wand2, CheckCircle2, XCircle,
  Clock, ChevronDown, ChevronRight
} from 'lucide-react';

export function TestRunner() {
  const {
    parsedApi, selectedEndpoint, testResults, setTestResults
  } = useApiStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [generatedTests, setGeneratedTests] = useState<{
    jest: string; mocha: string; pytest: string;
  } | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<'jest' | 'mocha' | 'pytest'>('jest');
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());

  if (!selectedEndpoint || !parsedApi) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-4xl mb-3">🧪</p>
          <p>Select an endpoint to generate and run tests</p>
        </div>
      </div>
    );
  }

  const generateTests = async () => {
    setIsGenerating(true);
    try {
      const response = await api.generateTests(selectedEndpoint, parsedApi);
      if (response.data.success) {
        setGeneratedTests(response.data.data);
        toast.success('✨ Test suites generated!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate tests');
    } finally {
      setIsGenerating(false);
    }
  };

  const runQuickTests = async () => {
    setIsRunning(true);
    try {
      // Build quick functional tests from the endpoint spec
      const tests = [];
      const basePath = selectedEndpoint.path;

      // Test 1: Happy path
      tests.push({
        name: `${selectedEndpoint.method} ${basePath} - Should respond`,
        method: selectedEndpoint.method,
        url: basePath,
        expectedStatus: selectedEndpoint.method === 'GET' ? 200 : undefined,
        assertions: [
          { type: 'time' as const, operator: 'lt' as const, value: 5000 },
        ],
      });

      // Test 2: Check response time
      tests.push({
        name: `${selectedEndpoint.method} ${basePath} - Response time < 2s`,
        method: selectedEndpoint.method,
        url: basePath,
        assertions: [
          { type: 'time' as const, operator: 'lt' as const, value: 2000 },
        ],
      });

      // Test 3: 404 for invalid path
      tests.push({
        name: `GET ${basePath}/nonexistent - Should return 404`,
        method: 'GET',
        url: `${basePath}/nonexistent_${Date.now()}`,
        expectedStatus: 404,
      });

      const response = await api.runTests(tests, parsedApi.baseUrl);
      if (response.data.success) {
        setTestResults(response.data);
        toast.success(
          `Tests complete: ${response.data.summary.passed}/${response.data.summary.total} passed`
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to run tests');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleResult = (index: number) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold">
          Tests — {selectedEndpoint.method} {selectedEndpoint.path}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={runQuickTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20
              text-green-400 rounded-lg text-sm hover:bg-green-500/30
              disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Quick Tests
          </button>
          <button
            onClick={generateTests}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r
              from-purple-500 to-pink-500 text-white rounded-lg text-sm
              font-medium hover:shadow-lg disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Generate Test Suites
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Test Results Panel */}
        <div className="flex-1 overflow-auto">
          {testResults ? (
            <div>
              {/* Summary */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {testResults.summary.total}
                    </p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {testResults.summary.passed}
                    </p>
                    <p className="text-xs text-gray-500">Passed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {testResults.summary.failed}
                    </p>
                    <p className="text-xs text-gray-500">Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      {testResults.summary.passRate}
                    </p>
                    <p className="text-xs text-gray-500">Pass Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {testResults.summary.totalTime}ms
                    </p>
                    <p className="text-xs text-gray-500">Total Time</p>
                  </div>
                </div>
              </div>

              {/* Individual Results */}
              <div className="space-y-2">
                {testResults.results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleResult(index)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50"
                    >
                      {result.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <span className="text-sm flex-1 text-left truncate">
                        {result.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                        <Clock className="w-3 h-3" />
                        {result.time}ms
                      </span>
                      {expandedResults.has(index) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                      )}
                    </button>

                    {expandedResults.has(index) && (
                      <div className="border-t border-gray-800 px-4 py-3 bg-gray-950/50">
                        {result.status !== null && (
                          <p className="text-xs text-gray-400 mb-2">
                            Status: <span className="text-white">{result.status}</span>
                          </p>
                        )}
                        {result.error && (
                          <p className="text-xs text-red-400 mb-2">
                            Error: {result.error}
                          </p>
                        )}
                        {result.assertions.length > 0 && (
                          <div className="space-y-1">
                            {result.assertions.map((a, i) => (
                              <p key={i} className="text-xs font-mono">
                                {a.message}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600">
              <div className="text-center">
                <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Run tests to see results</p>
              </div>
            </div>
          )}
        </div>

        {/* Generated Test Code Panel */}
        {generatedTests && (
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex gap-1 mb-2 shrink-0">
              {(['jest', 'mocha', 'pytest'] as const).map(fw => (
                <button
                  key={fw}
                  onClick={() => setSelectedFramework(fw)}
                  className={`px-3 py-1.5 text-xs rounded-md ${
                    selectedFramework === fw
                      ? 'bg-yellow-400/20 text-yellow-400'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {fw.charAt(0).toUpperCase() + fw.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden min-h-0">
              <Editor
                height="100%"
                language={selectedFramework === 'pytest' ? 'python' : 'javascript'}
                theme="vs-dark"
                value={generatedTests[selectedFramework] || '// No tests generated'}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
