import React, { useState, useEffect } from 'react';
import { useApiStore } from '../stores/apiStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { Send, Wand2, Loader2, Clock, Database, Zap } from 'lucide-react';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
  PATCH: 'bg-purple-500/20 text-purple-400',
};

export function EndpointView() {
  const {
    parsedApi, selectedEndpoint, responseData, setResponseData,
    setTestData, testData, addToHistory
  } = useApiStore();

  const [headers, setHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json'
  });
  const [body, setBody] = useState('');
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset form when endpoint changes
  useEffect(() => {
    setBody('');
    setPathParams({});
    setQueryParams({});
  }, [selectedEndpoint?.id]);

  if (!selectedEndpoint || !parsedApi) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-4xl mb-3">👈</p>
          <p>Select an endpoint from the sidebar</p>
        </div>
      </div>
    );
  }

  const buildUrl = (): string => {
    let url = `${parsedApi.baseUrl}${selectedEndpoint.path}`;
    Object.entries(pathParams).forEach(([key, value]) => {
      if (value) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }
    });
    const queryString = Object.entries(queryParams)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (queryString) url += `?${queryString}`;
    return url;
  };

  const generateTestData = async () => {
    setIsGenerating(true);
    try {
      const response = await api.generateTestData(selectedEndpoint, parsedApi);
      if (response.data.success) {
        setTestData(response.data.data);
        if (response.data.data.happyPath?.[0]) {
          setBody(JSON.stringify(response.data.data.happyPath[0], null, 2));
        }
        toast.success('✨ Test data generated!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate test data');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendRequest = async () => {
    setIsSending(true);
    try {
      let parsedBody: any = undefined;
      if (body.trim()) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          toast.error('Invalid JSON in request body');
          setIsSending(false);
          return;
        }
      }

      const response = await api.sendRequest({
        method: selectedEndpoint.method,
        url: buildUrl(),
        headers,
        body: parsedBody,
      });

      const resData = response.data.data;
      setResponseData(resData);

      addToHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        method: selectedEndpoint.method,
        url: buildUrl(),
        status: resData.status,
        time: resData.time,
      });

      const statusColor = resData.status < 300 ? '✅' : resData.status < 400 ? '⚠️' : '❌';
      toast.success(`${statusColor} ${resData.status} — ${resData.time}ms`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    } finally {
      setIsSending(false);
    }
  };

  const pathParamFields = selectedEndpoint.parameters.filter(p => p.in === 'path');
  const queryParamFields = selectedEndpoint.parameters.filter(p => p.in === 'query');
  const headerParamFields = selectedEndpoint.parameters.filter(p => p.in === 'header');

  return (
    <div className="h-full flex flex-col">
      {/* URL Bar */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3 shrink-0">
        <span className={`px-3 py-1.5 rounded-md text-xs font-bold shrink-0
          ${METHOD_COLORS[selectedEndpoint.method] || ''}`}>
          {selectedEndpoint.method}
        </span>
        <code className="flex-1 bg-gray-900 px-4 py-2 rounded-md text-sm
          font-mono text-gray-300 border border-gray-800 truncate min-w-0">
          {buildUrl()}
        </code>
        <button
          onClick={generateTestData}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20
            text-purple-400 rounded-md text-sm hover:bg-purple-500/30
            disabled:opacity-50 shrink-0"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          AI Generate
        </button>
        <button
          onClick={sendRequest}
          disabled={isSending}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r
            from-yellow-400 to-orange-500 text-black font-semibold
            rounded-md text-sm hover:shadow-lg
            disabled:opacity-50 shrink-0"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </button>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Request Panel */}
        <div className="flex-1 border-r border-gray-800 overflow-auto">
          <div className="p-4 space-y-4">
            {/* Path Params */}
            {pathParamFields.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wider">
                  Path Parameters
                </h3>
                {pathParamFields.map(param => (
                  <div key={param.name} className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-gray-500 w-28 shrink-0 font-mono">
                      :{param.name}
                      {param.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder={String(param.example || param.type)}
                      value={pathParams[param.name] || ''}
                      onChange={(e) => setPathParams(prev => ({
                        ...prev, [param.name]: e.target.value
                      }))}
                      className="flex-1 bg-gray-800 border border-gray-700
                        rounded px-3 py-1.5 text-xs outline-none
                        focus:border-yellow-400"
                    />
                  </div>
                ))}
              </section>
            )}

            {/* Query Params */}
            {queryParamFields.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wider">
                  Query Parameters
                </h3>
                {queryParamFields.map(param => (
                  <div key={param.name} className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-gray-500 w-28 shrink-0 font-mono">
                      ?{param.name}
                      {param.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder={String(param.example || param.type)}
                      value={queryParams[param.name] || ''}
                      onChange={(e) => setQueryParams(prev => ({
                        ...prev, [param.name]: e.target.value
                      }))}
                      className="flex-1 bg-gray-800 border border-gray-700
                        rounded px-3 py-1.5 text-xs outline-none
                        focus:border-yellow-400"
                    />
                  </div>
                ))}
              </section>
            )}

            {/* Header Params */}
            {headerParamFields.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wider">
                  Headers
                </h3>
                {headerParamFields.map(param => (
                  <div key={param.name} className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-gray-500 w-28 shrink-0 font-mono">
                      {param.name}
                    </label>
                    <input
                      type="text"
                      placeholder={String(param.example || param.type)}
                      onChange={(e) => setHeaders(prev => ({
                        ...prev, [param.name]: e.target.value
                      }))}
                      className="flex-1 bg-gray-800 border border-gray-700
                        rounded px-3 py-1.5 text-xs outline-none
                        focus:border-yellow-400"
                    />
                  </div>
                ))}
              </section>
            )}

            {/* Request Body */}
            {selectedEndpoint.requestBody && (
              <section>
                <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wider">
                  Request Body
                  <span className="ml-2 text-gray-600 font-normal normal-case">
                    {selectedEndpoint.requestBody.contentType}
                  </span>
                </h3>
                <div className="h-64 border border-gray-700 rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={body}
                    onChange={(val) => setBody(val || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'off',
                      padding: { top: 8 },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              </section>
            )}

            {/* AI Test Data Preview */}
            {testData && (
              <section className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-purple-400 mb-2">
                  🧠 AI Generated Test Data
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(testData).map(([category, data]) => (
                    <button
                      key={category}
                      onClick={() => {
                        const val = Array.isArray(data) ? (data as any[])[0] : data;
                        setBody(JSON.stringify(val, null, 2));
                      }}
                      className="text-left bg-gray-800 rounded px-3 py-2
                        text-xs hover:bg-gray-700"
                    >
                      <span className="text-purple-300 font-medium">
                        {category}
                      </span>
                      <p className="text-gray-500 mt-0.5 truncate text-[10px]">
                        {JSON.stringify(data).substring(0, 60)}...
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Response Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {responseData ? (
            <div className="p-4 flex flex-col h-full">
              {/* Status Bar */}
              <div className="flex items-center gap-4 mb-4 shrink-0">
                <span className={`px-3 py-1 rounded-md text-sm font-bold ${
                  responseData.status < 300 ? 'bg-green-500/20 text-green-400' :
                  responseData.status < 400 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {responseData.status} {responseData.statusText}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {responseData.time}ms
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Database className="w-3 h-3" />
                  {(responseData.size / 1024).toFixed(1)}KB
                </span>
              </div>

              {/* Response Body */}
              <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden min-h-0">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={JSON.stringify(responseData.body, null, 2)}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'off',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600">
              <div className="text-center">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click Send to see the response</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
