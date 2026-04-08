import { useState } from "react";
import { useApiStore } from "../stores/apiStore";
import { api } from "../lib/api";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import toast from "react-hot-toast";
import { Copy, Check, Loader2, Wand2 } from "lucide-react";

const LANG: Record<string, string> = {
  "JavaScript (fetch)": "javascript",
  "JavaScript (axios)": "javascript",
  "Python (requests)": "python",
  "Python (httpx)": "python",
  cURL: "bash",
  "PHP (Guzzle)": "php",
  "Java (HttpClient)": "java",
  "Go (net/http)": "go",
  "Rust (reqwest)": "rust",
  "C# (HttpClient)": "csharp",
  "Ruby (Net::HTTP)": "ruby",
  "Swift (URLSession)": "swift",
  "Kotlin (OkHttp)": "kotlin",
  "Dart (http)": "dart",
};

export function CodeExamples() {
  const { selectedEndpoint, parsedApi, codeExamples, setCodeExamples } = useApiStore();
  const [sel, setSel] = useState("JavaScript (fetch)");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!selectedEndpoint || !parsedApi)
    return <div className="h-full flex items-center justify-center text-gray-500">💻 Select an endpoint</div>;

  const generate = async () => {
    setLoading(true);
    try {
      const r = await api.generateCodeExamples(selectedEndpoint, parsedApi);
      if (r.data.success) {
        setCodeExamples(r.data.data);
        const first = Object.keys(r.data.data)[0];
        if (first) setSel(first);
        toast.success("✨ Code generated!");
      }
    } catch (e: any) { toast.error(e.response?.data?.error || "Failed"); }
    finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(codeExamples[sel] || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const has = Object.keys(codeExamples).length > 0;

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-semibold truncate">Code — {selectedEndpoint.method} {selectedEndpoint.path}</h2>
        <button onClick={generate} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Generate 14 Languages
        </button>
      </div>
      {has ? (
        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          <div className="w-44 overflow-auto space-y-1 shrink-0">
            {Object.keys(codeExamples).map((l) => (
              <button key={l} onClick={() => setSel(l)} className={`w-full text-left px-3 py-2 rounded text-xs ${sel === l ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30" : "text-gray-400 hover:bg-gray-800 border border-transparent"}`}>{l}</button>
            ))}
          </div>
          <div className="flex-1 relative overflow-auto rounded-lg border border-gray-700 min-w-0">
            <button onClick={copy} className="absolute top-3 right-3 z-10 p-2 bg-gray-800 rounded hover:bg-gray-700" title="Copy">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
            <SyntaxHighlighter language={LANG[sel] || "text"} style={oneDark} customStyle={{ margin: 0, borderRadius: 8, fontSize: 13, padding: 20, minHeight: "100%", background: "#0d1117" }} wrapLongLines>
              {codeExamples[sel] || "// Select a language"}
            </SyntaxHighlighter>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Click Generate above</div>
      )}
    </div>
  );
}
