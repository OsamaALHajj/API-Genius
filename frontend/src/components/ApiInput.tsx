import { useState } from "react";
import { Search, Loader2, Zap } from "lucide-react";
import { useApiStore } from "../stores/apiStore";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export function ApiInput() {
  const [url, setUrl] = useState("");
  const { isLoading, setLoading, setParsedApi } = useApiStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    setLoading(true);
    const tid = toast.loading("🔍 Analyzing API...");

    try {
      const resp = await api.parseUrl(url.trim());
      if (resp.data.success) {
        setParsedApi(resp.data.data);
        toast.success(`✅ Found ${resp.data.stats.totalEndpoints} endpoints!`, { id: tid });
      } else {
        throw new Error(resp.data.error);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to parse API";
      toast.error(msg, { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste API URL or OpenAPI/Swagger spec..."
          className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 outline-none placeholder-gray-500"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !url.trim()}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-6 py-2.5 rounded-lg text-sm hover:shadow-lg hover:shadow-yellow-400/20 disabled:opacity-50 flex items-center gap-2 shrink-0"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        Analyze
      </button>
    </form>
  );
}
