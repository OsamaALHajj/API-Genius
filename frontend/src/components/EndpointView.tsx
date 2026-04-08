import { useState, useEffect } from "react";
import { useApiStore } from "../stores/apiStore";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";
import { Send, Wand2, Loader2, Clock, Database } from "lucide-react";

const MC: Record<string, string> = {
  GET: "bg-green-500/20 text-green-400",
  POST: "bg-blue-500/20 text-blue-400",
  PUT: "bg-yellow-500/20 text-yellow-400",
  DELETE: "bg-red-500/20 text-red-400",
  PATCH: "bg-purple-500/20 text-purple-400",
};

export function EndpointView() {
  const { parsedApi, selectedEndpoint, responseData, setResponseData, testData, setTestData, addToHistory } = useApiStore();
  const [headers, setHeaders] = useState<Record<string, string>>({ "Content-Type": "application/json" });
  const [body, setBody] = useState("");
  const [pathP, setPathP] = useState<Record<string, string>>({});
  const [queryP, setQueryP] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setBody("");
    setPathP({});
    setQueryP({});
  }, [selectedEndpoint?.id]);

  if (!selectedEndpoint || !parsedApi) {
    return <div className="h-full flex items-center justify-center text-gray-500">👈 Select an endpoint</div>;
  }

  const buildUrl = () => {
    let u = `${parsedApi.baseUrl}${selectedEndpoint.path}`;
    Object.entries(pathP).forEach(([k, v]) => { if (v) u = u.replace(`{${k}}`, encodeURIComponent(v)); });
    const qs = Object.entries(queryP).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    if (qs) u += `?${qs}`;
    return u;
  };

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const r = await api.generateTestData(selectedEndpoint, parsedApi);
      if (r.data.success) {
        setTestData(r.data.data);
        const hp = r.data.data.happyPath;
        if (hp?.[0]) setBody(JSON.stringify(hp[0], null, 2));
        toast.success("✨ Test data generated!");
      }
    } catch (e: any) { toast.error(e.response?.data?.error || "Failed"); }
    finally { setGenerating(false); }
  };

  const onSend = async () => {
    setSending(true);
    try {
      let parsedBody: any;
      if (body.trim()) {
        try { parsedBody = JSON.parse(body); } catch { toast.error("Invalid JSON body"); setSending(false); return; }
      }
      const r = await api.sendRequest({ method: selectedEndpoint.method, url: buildUrl(), headers, body: parsedBody });
      const d = r.data.data;
      setResponseData(d);
      addToHistory({ id: String(Date.now()), timestamp: Date.now(), method: selectedEndpoint.method, url: buildUrl(), status: d.status, time: d.time });
      toast.success(`${d.status < 300 ? "✅" : "❌"} ${d.status} — ${d.time}ms`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const pp = selectedEndpoint.parameters.filter((p) => p.in === "path");
  const qp = selectedEndpoint.parameters.filter((p) => p.in === "query");

  return (
    <div className="h-full flex flex-col">
      {/* URL bar */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3 shrink-0 flex-wrap">
        <span className={`px-3 py-1.5 rounded text-xs font-bold shrink-0 ${MC[selectedEndpoint.method]}`}>{selectedEndpoint.method}</span>
        <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm font-mono text-gray-300 border border-gray-800 truncate min-w-0">{buildUrl()}</code>
        <button onClick={onGenerate} disabled={generating} className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 rounded text-sm hover:bg-purple-500/30 disabled:opacity-50 shrink-0">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Data
        </button>
        <button onClick={onSend} disabled={sending} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded text-sm disabled:opacity-50 shrink-0">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Request */}
        <div className="flex-1 border-r border-gray-800 overflow-auto p-4 space-y-4">
          {pp.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Path Parameters</h3>
              {pp.map((p) => (
                <div key={p.name} className="flex items-center gap-2 mb-2">
                  <label className="text-xs text-gray-500 w-24 font-mono shrink-0">:{p.name}{p.required && <span className="text-red-400">*</span>}</label>
                  <input value={pathP[p.name] || ""} onChange={(e) => setPathP((s) => ({ ...s, [p.name]: e.target.value }))} placeholder={String(p.example || p.type)} className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs outline-none focus:border-yellow-400" />
                </div>
              ))}
            </div>
          )}
          {qp.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Query Parameters</h3>
              {qp.map((p) => (
                <div key={p.name} className="flex items-center gap-2 mb-2">
                  <label className="text-xs text-gray-500 w-24 font-mono shrink-0">?{p.name}</label>
                  <input value={queryP[p.name] || ""} onChange={(e) => setQueryP((s) => ({ ...s, [p.name]: e.target.value }))} placeholder={String(p.example || p.type)} className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs outline-none focus:border-yellow-400" />
                </div>
              ))}
            </div>
          )}
          {selectedEndpoint.requestBody && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Request Body</h3>
              <div className="h-56 border border-gray-700 rounded-lg overflow-hidden">
                <Editor height="100%" defaultLanguage="json" theme="vs-dark" value={body} onChange={(v) => setBody(v || "")} options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: "off", scrollBeyondLastLine: false, wordWrap: "on" }} />
              </div>
            </div>
          )}
          {testData && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-purple-400 mb-2">🧠 AI Test Data</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(testData).map(([cat, data]) => (
                  <button key={cat} onClick={() => { const v = Array.isArray(data) ? (data as any[])[0] : data; setBody(JSON.stringify(v, null, 2)); }} className="text-left bg-gray-800 rounded px-3 py-2 text-xs hover:bg-gray-700">
                    <span className="text-purple-300 font-medium">{cat}</span>
                    <p className="text-gray-500 truncate text-[10px] mt-0.5">{JSON.stringify(data).substring(0, 50)}...</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Response */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {responseData ? (
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-3 shrink-0">
                <span className={`px-3 py-1 rounded text-sm font-bold ${responseData.status < 300 ? "bg-green-500/20 text-green-400" : responseData.status < 400 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{responseData.status} {responseData.statusText}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{responseData.time}ms</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><Database className="w-3 h-3" />{(responseData.size / 1024).toFixed(1)}KB</span>
              </div>
              <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden min-h-0">
                <Editor height="100%" defaultLanguage="json" theme="vs-dark" value={JSON.stringify(responseData.body, null, 2)} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: "off", scrollBeyondLastLine: false, wordWrap: "on" }} />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm">
              <div className="text-center"><Send className="w-6 h-6 mx-auto mb-2 opacity-30" /><p>Click Send</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
