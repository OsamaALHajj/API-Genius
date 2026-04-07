import React, { useState } from 'react';
import { useApiStore } from '../stores/apiStore';
import { api } from '../lib/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import { Copy, Check, Loader2, Wand2 } from 'lucide-react';

const LANG_SYNTAX_MAP: Record<string, string> = {
  'JavaScript (fetch)': 'javascript',
  'JavaScript (axios)': 'javascript',
  'Python (requests)': 'python',
  'Python (httpx)': 'python',
  'cURL': 'bash',
  'PHP (Guzzle)': 'php',
  'Java (HttpClient)': 'java',
  'Go (net/http)': 'go',
  'Rust (reqwest)': 'rust',
  'C# (HttpClient)': 'csharp',
  'Ruby (Net::HTTP)': 'ruby',
  'Swift (URLSession)': 'swift',
  'Kotlin (OkHttp)': 'kotlin',
  'Dart (http)': 'dart',
};

export function CodeExamples() {
  const { selectedEndpoint, parsedApi, codeExamples, setCodeExamples } = useApiStore();
  const [selectedLang, setSelectedLang] = useState('JavaScript (fetch)');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!selectedEndpoint || !parsedApi) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-4xl mb-3">💻</p>
          <p>Select an endpoint to generate code examples</p>
        </div>
      </div>
    );
  }

  const generateExamples = async () => {
    setIsLoading(true);
    try {
      const response = await api.generateCodeExamples(selectedEndpoint, parsedApi);
      if (response.data.success) {
        setCodeExamples(response.data.data);
        // Select first available language
        const firstLang = Object.keys(response.data.data)[0];
        if (firstLang) setSelectedLang(firstLang);
        toast.success('✨ Code generated in 14 languages!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate code');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    const code = codeExamples[selectedLang];
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const hasExamples = Object.keys(codeExamples).length > 0;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-semibold truncate">
          Code Examples — {selectedEndpoint.method} {selectedEndpoint.path}
        </h2>
        <button
          onClick={generateExamples}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r
            from-purple-500 to-pink-500 text-white rounded-lg text-sm
            font-medium hover:shadow-lg disabled:opacity-50 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Generate for 14 Languages
        </button>
      </div>

      {hasExamples ? (
        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          {/* Language Selector */}
          <div className="w-48 overflow-auto space-y-1 shrink-0">
            {Object.keys(codeExamples).map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs
                  transition-colors ${
                  selectedLang === lang
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                    : 'text-gray-400 hover:bg-gray-800 border border-transparent'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Code Display */}
          <div className="flex-1 relative overflow-auto rounded-lg border border-gray-700 min-w-0">
            <button
              onClick={copyCode}
              className="absolute top-3 right-3 z-10 p-2 bg-gray-800
                rounded-md hover:bg-gray-700"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <SyntaxHighlighter
              language={LANG_SYNTAX_MAP[selectedLang] || 'text'}
              style={oneDark}
              customStyle={{
                margin: 0,
                borderRadius: 8,
                fontSize: 13,
                padding: 20,
                minHeight: '100%',
                background: '#0d1117',
              }}
              wrapLongLines
            >
              {codeExamples[selectedLang] || '// No code generated for this language'}
            </SyntaxHighlighter>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-5xl mb-4">💻</p>
            <p>Click "Generate" to create code examples in all languages</p>
          </div>
        </div>
      )}
    </div>
  );
}
