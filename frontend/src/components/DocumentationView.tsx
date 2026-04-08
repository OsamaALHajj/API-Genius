import { useState } from "react";
import { useApiStore } from "../stores/apiStore";
import { api } from "../lib/api";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { Loader2, Wand2, Download, Copy } from "lucide-react";

export function DocumentationView() {
  const { parsedApi, documentation, setDocumentation } = useApiStore();
  const [loading, setLoading] = useState(false);

  if (!parsedApi) return <div className="h-full flex items-center justify-center text-gray-500">Load an API first</div>;

  const generate = async () => {
    setLoading(true);
    try {
      const r = await api.generateDocumentation(parsedApi);
      if (r.data.success) { setDocumentation(r.data.data); toast.success("📝 Docs generated!"); }
    } catch (e: any) { toast.error(e.response?.data?.error || "Failed"); }
    finally { setLoading(false); }
  };

  const download = () => {
    const b = new Blob([documentation], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `${parsedApi.title.replace(/\s+/g, "-")}-docs.md`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-semibold">Documentation</h2>
        <div className="flex gap-2">
          {documentation && (
            <>
              <button onClick={() => { navigator.clipboard.writeText(documentation); toast.success("Copied!"); }} className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded text-xs hover:bg-gray-700"><Copy className="w-3 h-3" />Copy</button>
              <button onClick={download} className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded text-xs hover:bg-gray-700"><Download className="w-3 h-3" />Download</button>
            </>
          )}
          <button onClick={generate} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Generate Docs
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-900 rounded-lg border border-gray-800 p-8 min-h-0">
        {documentation ? (
          <article className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{documentation}</ReactMarkdown>
          </article>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">📖 Click Generate</div>
        )}
      </div>
    </div>
  );
}
