import { useState, useMemo } from 'react';
import { useApiStore } from '../stores/apiStore';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
  PATCH: 'bg-purple-500/20 text-purple-400',
};

export function Sidebar() {
  const { parsedApi, selectedEndpoint, setSelectedEndpoint } = useApiStore();
  const [search, setSearch] = useState('');
  const [expandedTags, setExpandedTags] = useState<Set<string>>(
    () => new Set(parsedApi?.endpoints.flatMap(e => e.tags) || [])
  );

  const grouped = useMemo(() => {
    if (!parsedApi) return {};
    const groups: Record<string, typeof parsedApi.endpoints> = {};

    parsedApi.endpoints
      .filter(ep =>
        ep.path.toLowerCase().includes(search.toLowerCase()) ||
        ep.summary.toLowerCase().includes(search.toLowerCase()) ||
        ep.method.toLowerCase().includes(search.toLowerCase())
      )
      .forEach(ep => {
        const tag = ep.tags[0] || 'General';
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(ep);
      });

    return groups;
  }, [parsedApi, search]);

  const toggleTag = (tag: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  if (!parsedApi) return null;

  return (
    <aside className="w-80 border-r border-gray-800 flex flex-col bg-gray-900/50 shrink-0">
      {/* API Info */}
      <div className="p-4 border-b border-gray-800 shrink-0">
        <h2 className="font-semibold text-sm truncate">{parsedApi.title}</h2>
        <p className="text-xs text-gray-500 mt-1">
          v{parsedApi.version} · {parsedApi.endpoints.length} endpoints
        </p>
      </div>

      {/* Search */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full bg-gray-800 border border-gray-700 rounded-md
              pl-8 pr-3 py-1.5 text-xs focus:border-yellow-400 outline-none"
          />
        </div>
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-auto px-2 pb-4">
        {Object.entries(grouped).map(([tag, endpoints]) => (
          <div key={tag} className="mb-1">
            <button
              onClick={() => toggleTag(tag)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5
                text-xs font-medium text-gray-400 hover:text-white"
            >
              {expandedTags.has(tag) ? (
                <ChevronDown className="w-3 h-3 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">{tag}</span>
              <span className="ml-auto text-gray-600 text-[10px] shrink-0">
                {endpoints.length}
              </span>
            </button>

            {expandedTags.has(tag) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {endpoints.map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep)}
                    className={`w-full flex items-center gap-2 px-2 py-2
                      rounded-md text-left mb-0.5 ${
                      selectedEndpoint?.id === ep.id
                        ? 'bg-yellow-400/10 border border-yellow-400/30'
                        : 'hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <span className={`text-[10px] font-bold px-1.5 py-0.5
                      rounded shrink-0 ${METHOD_COLORS[ep.method] || ''}`}>
                      {ep.method}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono truncate text-gray-300">
                        {ep.path}
                      </p>
                      {ep.summary && (
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {ep.summary}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        ))}

        {Object.keys(grouped).length === 0 && search && (
          <p className="text-xs text-gray-500 text-center py-4">
            No endpoints match "{search}"
          </p>
        )}
      </div>
    </aside>
  );
}
