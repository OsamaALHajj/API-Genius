import { useState } from "react";
import { useApiStore } from "../stores/apiStore";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";
import { Play, Loader2, Wand2, CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";

export function TestRunner() {
  const { parsedApi, selectedEndpoint, testResults, setTestResults } = useApiStore();
  const [genLoading, setGenLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [genTests, setGenTests] = useState<{ jest: string; mocha: string; pytest: string } | null>(null);
  const [fw, setFw] = useState<"jest" | "mocha" | "pytest">("jest");
  const [openIdx, setOpenIdx] = useState<Set<number>>(new Set());

  if (!selectedEndpoint || !parsedApi)
    return <div className="h-full flex items-center justify-center text-gray-500">🧪 Select an endpoint first</div>;

  const generate = async () => {
    setGenLoading(true);
    try {
      const r = await api.generateTests(selectedEndpoint, parsedApi);
      if (r.data.success) { setGenTests(r.data.data); toast.success("✨ Tests generated!"); }
    } catch (e: any) { toast.error(e.response?.data?.error || "Failed"); }
    finally { setGenLoading(false); }
  };

  const run = async () => {
    setRunLoading(true);
    try {
      const tests = [
        { name: `${selectedEndpoint.method} ${selectedEndpoint.path} - responds`, method: selectedEndpoint.method, url: selectedEndpoint.path, assertions: [{ type: "time" as const, operator: "lt" as const, value: 5000 }] },
        { name: `GET ${selectedEndpoint.path}/invalid_999 - 404`, method: "GET", url: `${selectedEndpoint.path}/invalid_${Date.now()}`, expectedStatus: 404 },
      ];
      const r = await api.runTests(tests, parsedApi.baseUrl);
      if (r.data.success) {
        setTestResults(r.data);
        toast.success(`${r.data.summary.passed}/${r.data.summary.total} passed`);
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setRunLoading(false); }
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold truncate">Tests — {selectedEndpoint.method} {selectedEndpoint.path}</h2>
        <div className="flex gap-2">
          <button onClick={run} disabled={runLoading} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm disabled:opacity-50">
            {runLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run Quick Tests
          </button>
          <button onClick={generate} disabled={genLoading} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Generate Suites
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Results */}
        <div className="flex-1 overflow-auto">
          {testResults ? (
            <div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4 flex gap-6">
                {[
                  { l: "Total", v: testResults.summary.total, c: "text-white" },
                  { l: "Passed", v: testResults.summary.passed, c: "text-green-400" },
                  { l: "Failed", v: testResults.summary.failed, c: "text-red-400" },
                  { l: "Rate", v: testResults.summary.passRate, c: "text-yellow-400" },
                  { l: "Time", v: `${testResults.summary.totalTime}ms`, c: "text-blue-400" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
                    <p className="text-xs text-gray-500">{s.l}</p>
                  </div>
                ))}
              </div>
              {testResults.results.map((r, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg mb-2 overflow-hidden">
                  <button onClick={() => setOpenIdx((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; })} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50">
                    {r.passed ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                    <span className="text-sm flex-1 text-left truncate">{r.name}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{r.time}ms</span>
                    {openIdx.has(i) ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </button>
                  {openIdx.has(i) && (
                    <div className="border-t border-gray-800 px-4 py-3 text-xs space-y-1">
                      {r.error && <p className="text-red-400">Error: {r.error}</p>}
                      {r.assertions.map((a, j) => <p key={j} className="font-mono">{a.message}</p>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm">
              <div className="text-center"><Play className="w-6 h-6 mx-auto mb-2 opacity-30" /><p>Run tests to see results</p></div>
            </div>
          )}
        </div>

        {/* Generated code */}
        {genTests && (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex gap-1 mb-2 shrink-0">
              {(["jest", "mocha", "pytest"] as const).map((f) => (
                <button key={f} onClick={() => setFw(f)} className={`px-3 py-1.5 text-xs rounded ${fw === f ? "bg-yellow-400/20 text-yellow-400" : "text-gray-400 hover:bg-gray-800"}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden min-h-0">
              <Editor height="100%" language={fw === "pytest" ? "python" : "javascript"} theme="vs-dark" value={genTests[fw] || ""} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false, wordWrap: "on" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
