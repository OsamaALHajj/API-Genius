import { create } from 'zustand';
import type {
  ParsedAPI,
  ParsedEndpoint,
  HistoryItem,
  ResponseData,
  TestResult,
  TestSummary,
} from '../types';

type ActiveTab = 'endpoints' | 'tests' | 'docs' | 'code';

interface ApiState {
  // State
  parsedApi: ParsedAPI | null;
  selectedEndpoint: ParsedEndpoint | null;
  isLoading: boolean;
  activeTab: ActiveTab;
  testData: any;
  codeExamples: Record<string, string>;
  testResults: { summary: TestSummary; results: TestResult[] } | null;
  documentation: string;
  responseData: ResponseData | null;
  history: HistoryItem[];

  // Actions
  setParsedApi: (api: ParsedAPI) => void;
  setSelectedEndpoint: (endpoint: ParsedEndpoint) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setTestData: (data: any) => void;
  setCodeExamples: (examples: Record<string, string>) => void;
  setTestResults: (results: { summary: TestSummary; results: TestResult[] } | null) => void;
  setDocumentation: (doc: string) => void;
  setResponseData: (data: ResponseData | null) => void;
  addToHistory: (item: HistoryItem) => void;
  reset: () => void;
}

const initialState = {
  parsedApi: null,
  selectedEndpoint: null,
  isLoading: false,
  activeTab: 'endpoints' as ActiveTab,
  testData: null,
  codeExamples: {},
  testResults: null,
  documentation: '',
  responseData: null,
  history: [],
};

export const useApiStore = create<ApiState>((set) => ({
  ...initialState,

  setParsedApi: (api) => set({
    parsedApi: api,
    selectedEndpoint: api.endpoints[0] || null,
    // Reset generated data when new API is loaded
    testData: null,
    codeExamples: {},
    testResults: null,
    documentation: '',
    responseData: null,
  }),
  setSelectedEndpoint: (endpoint) => set({
    selectedEndpoint: endpoint,
    // Reset endpoint-specific data
    testData: null,
    codeExamples: {},
    responseData: null,
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTestData: (data) => set({ testData: data }),
  setCodeExamples: (examples) => set({ codeExamples: examples }),
  setTestResults: (results) => set({ testResults: results }),
  setDocumentation: (doc) => set({ documentation: doc }),
  setResponseData: (data) => set({ responseData: data }),
  addToHistory: (item) =>
    set((state) => ({
      history: [item, ...state.history].slice(0, 100),
    })),
  reset: () => set(initialState),
}));
