import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "react-hot-toast";
import { useApiStore } from "./stores/apiStore";
import { ApiInput } from "./components/ApiInput";
import { Sidebar } from "./components/Sidebar";
import { EndpointView } from "./components/EndpointView";
import { TestRunner } from "./components/TestRunner";
import { DocumentationView } from "./components/DocumentationView";
import { CodeExamples } from "./components/CodeExamples";
import { Zap, BookOpen, TestTube, Code2 } from "lucide-react";

const TABS = [
  { key: "endpoints" as const, label: "Request Builder", icon: Zap },
  { key: "tests" as const, label: "Tests", icon: TestTube },
  { key: "docs" as const, label: "Documentation", icon: BookOpen },
  { key: "code" as const, label: "Code Examples", icon: Code2 },
];

export default function App() {
  const { parsedApi, activeTab, setActiveTab } = useApiStore();

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" },
        }}
      />

      <header className="border-b border-gray-800 px-6 py-3 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <Zap className="w-7 h-7 text-yellow-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            API Genius
          </h1>
          <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
            AI
          </span>
        </div>
        <div className="flex-1">
          <ApiInput />
        </div>
      </header>

      {parsedApi ? (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex border-b border-gray-800 px-4 shrink-0">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                    activeTab === key
                      ? "border-yellow-400 text-yellow-400"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {activeTab === "endpoints" && <EndpointView />}
                  {activeTab === "tests" && <TestRunner />}
                  {activeTab === "docs" && <DocumentationView />}
                  {activeTab === "code" && <CodeExamples />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-xl px-6">
            <div className="text-7xl mb-4">⚡</div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Paste an API URL
            </h2>
            <p className="text-gray-400 mb-6">
              Paste an OpenAPI/Swagger spec URL and watch the magic
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                "📡 Auto-discover endpoints",
                "🧪 AI test data generation",
                "📝 Full documentation",
                "💻 Code in 14 languages",
                "🔒 Security testing",
                "⚡ Performance analysis",
              ].map((t) => (
                <div key={t} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-left text-gray-300">
                  {t}
                </div>
              ))}
            </div>
            <p className="mt-6 text-gray-600 text-xs">
              Try: <code className="bg-gray-800 px-2 py-1 rounded text-yellow-400">https://petstore.swagger.io/v2/swagger.json</code>
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
