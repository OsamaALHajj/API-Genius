import React, { useState } from 'react';
import { useApiStore } from '../stores/apiStore';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Loader2, Wand2, Download, Copy } from 'lucide-react';

export function DocumentationView() {
  const { parsedApi, documentation, setDocumentation } = useApiStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!parsedApi) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>Load an API first</p>
      </div>
    );
  }

  const generateDocs = async () => {
    setIsLoading(true);
    try {
      const response = await api.generateDocumentation(parsedApi);
      if (response.data.success) {
        setDocumentation(response.data.data);
        toast.success('📝 Documentation generated!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate documentation');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([documentation], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${parsedApi.title.replace(/\s+/g, '-').toLowerCase()}-docs.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(documentation);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-semibold">API Documentation</h2>
        <div className="flex gap-2">
          {documentation && (
            <>
              <button
                onClick={copyMarkdown}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800
                  rounded-lg text-xs hover:bg-gray-700"
              >
                <Copy className="w-3 h-3" /> Copy MD
              </button>
              <button
                onClick={downloadMarkdown}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800
                  rounded-lg text-xs hover:bg-gray-700"
              >
                <Download className="w-3 h-3" /> Download
              </button>
            </>
          )}
          <button
            onClick={generateDocs}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r
              from-green-500 to-emerald-500 text-white rounded-lg text-sm
              font-medium hover:shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Generate Documentation
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-900 rounded-lg border
        border-gray-800 p-8 min-h-0">
        {documentation ? (
          <article className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{documentation}</ReactMarkdown>
          </article>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-5xl mb-4">📖</p>
              <p>Click "Generate" to create complete API documentation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
