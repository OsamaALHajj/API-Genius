import { useState, useMemo } from "react";
import { useApiStore } from "../stores/apiStore";
import { Search, ChevronDown, ChevronRight } from "lucide-react";

const MC: Record<string, string> = {
  GET: "bg-green-500/20 text-green-400",
  POST: "bg-blue-500/20 text-blue-400",
  PUT: "bg-yellow-500/20 text-yellow-400",
  DELETE: "bg-red-500/20 text-red-400",
  PATCH: "bg-purple-500/20 text-purple-400",
};

export function Sidebar() {
  const { parsedApi, selectedEndpoint, setSelectedEndpoint } = useApiStore();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const tags = parsedApi?.endpoints.flatMap((e) => e.tags) || [];
    return new Set(tags);
  });

  const grouped = useMemo(() => {
    if (!parsedApi) return {};
    const g: Record<string, typeof parsedApi.endpoints> = {};
    parsedApi.endpoints
      .filter(
        (ep) =>
          ep.path.toLowerCase().includes(search.toLowerCase()) ||
          ep.summary.toLowerCase().includes(search.toLowerCase())
      )
      .forEach((ep) => {
        const tag = ep.tags[0] || "General";
        (g[tag] ??= []).push(ep);
      });
    return g;
  }, [parsedApi, search]);

  if (!parsedApi) return null;

  return (
    <aside className="w-72 border-r border-gray-800 flex flex-col bg-gray-900/50 shrink-0">
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-semibold text-sm truncate">{parsedApi.title}</h2>
        <p className="text-xs text-gray-500 mt-1">v{parsedApi.version} · {parsedApi.endpoints.length} endpoints</p>
      </div>
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-gray-800 border border-gray-700 rounded pl-7 pr-3 py-1.5 text-xs focus:border-yellow-400 outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto px-2 pb-4">
        {Object.entries(grouped).map(([tag, eps]) => (
          <div key={tag} className="mb-1">
            <button
              onClick={() =>
                setExpanded((p) => {
                  const n = new Set(p);
                  n.has(tag) ? n.delete(tag) : n.add(tag);
                  return n;
                })
              }
              className="flex items-center gap-1 w-full px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-white"
            >
              {expanded.has(tag) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {tag}
              <span className="ml-auto text-gray-600 text-[10px]">{eps.length}</span>
            </button>
            {expanded.has(tag) &&
              eps.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left mb-0.5 ${
                    selectedEndpoint?.id === ep.id
                      ? "bg-yellow-400/10 border border-yellow-400/30"
                      : "hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${MC[ep.method] || ""}`}>
                    {ep.method}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-mono truncate text-gray-300">{ep.path}</p>
                    {ep.summary && <p className="text-[10px] text-gray-500 truncate">{ep.summary}</p>}
                  </div>
                </button>
              ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
