import { AnimatePresence, motion } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { useApiStore } from './stores/apiStore';
import { ApiInput } from './components/ApiInput';
import { Sidebar } from './components/Sidebar';
import { EndpointView } from './components/EndpointView';
import { TestRunner } from './components/TestRunner';
import { DocumentationView } from './components/DocumentationView';
import { CodeExamples } from './components/CodeExamples';
import { Zap, BookOpen, TestTube, Code2 } from 'lucide-react';

const TABS = [
  { key: 'endpoints' as const, label: 'Request Builder', icon: Zap },
  { key: 'tests' as const, label: 'Tests', icon: TestTube },
  { key: 'docs' as const, label: 'Documentation', icon: BookOpen },
  { key: 'code' as const, label: 'Code Examples', icon: Code2 },
];

export default function App() {
  const { parsedApi, activeTab, setActiveTab } = useApiStore();

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <Zap className="w-7 h-7 text-yellow-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400
            to-orange-500 bg-clip-text text-transparent">
            API Genius
          </h1>
          <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-2
            py-0.5 rounded-full font-medium">
            AI-Powered
          </span>
        </div>
        <div className="flex-1">
          <ApiInput />
        </div>
      </header>

      {/* Main Content */}
      {parsedApi ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Tabs */}
            <div className="flex border-b border-gray-800 px-4 shrink-0">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm
                    border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
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
                  {activeTab === 'endpoints' && <EndpointView />}
                  {activeTab === 'tests' && <TestRunner />}
                  {activeTab === 'docs' && <DocumentationView />}
                  {activeTab === 'code' && <CodeExamples />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        <LandingScreen />
      )}
    </div>
  );
}

function LandingScreen() {
  const features = [
    { icon: '📡', text: 'Discover all Endpoints automatically' },
    { icon: '🧪', text: 'Generate smart test data with AI' },
    { icon: '📝', text: 'Create complete documentation' },
    { icon: '💻', text: 'Code examples in 14 languages' },
    { icon: '🔒', text: 'Automatic security tests' },
    { icon: '⚡', text: 'Performance & response analysis' },
  ];

  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-2xl mx-auto px-6"
      >
        <div className="text-8xl mb-6">🚀</div>
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400
          to-orange-500 bg-clip-text text-transparent">
          Paste an API URL and watch the magic
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Paste an OpenAPI/Swagger URL or any API URL and we will:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {features.map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-gray-900
              rounded-lg p-4 border border-gray-800 text-left">
              <span className="text-2xl shrink-0">{icon}</span>
              <span className="text-gray-300 text-sm">{text}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 text-gray-500 text-sm">
          Try for example:
          <code className="ml-2 bg-gray-800 px-3 py-1 rounded text-yellow-400 text-xs">
            https://petstore.swagger.io/v2/swagger.json
          </code>
        </div>
      </motion.div>
    </div>
  );
}
