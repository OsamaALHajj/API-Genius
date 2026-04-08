import { create } from "zustand";
import type {
  ParsedAPI,
  ParsedEndpoint,
  ResponseData,
  HistoryItem,
  TestResults,
} from "../types";

type Tab = "endpoints" | "tests" | "docs" | "code";

interface Store {
  parsedApi: ParsedAPI | null;
  selectedEndpoint: ParsedEndpoint | null;
  isLoading: boolean;
  activeTab: Tab;
  testData: any;
  codeExamples: Record<string, string>;
  testResults: TestResults | null;
  documentation: string;
  responseData: ResponseData | null;
  history: HistoryItem[];

  setParsedApi: (api: ParsedAPI) => void;
  setSelectedEndpoint: (ep: ParsedEndpoint) => void;
  setLoading: (v: boolean) => void;
  setActiveTab: (t: Tab) => void;
  setTestData: (d: any) => void;
  setCodeExamples: (e: Record<string, string>) => void;
  setTestResults: (r: TestResults | null) => void;
  setDocumentation: (d: string) => void;
  setResponseData: (d: ResponseData | null) => void;
  addToHistory: (h: HistoryItem) => void;
}

export const useApiStore = create<Store>((set) => ({
  parsedApi: null,
  selectedEndpoint: null,
  isLoading: false,
  activeTab: "endpoints",
  testData: null,
  codeExamples: {},
  testResults: null,
  documentation: "",
  responseData: null,
  history: [],

  setParsedApi: (api) =>
    set({
      parsedApi: api,
      selectedEndpoint: api.endpoints[0] || null,
      testData: null,
      codeExamples: {},
      testResults: null,
      documentation: "",
      responseData: null,
    }),
  setSelectedEndpoint: (ep) =>
    set({ selectedEndpoint: ep, testData: null, codeExamples: {}, responseData: null }),
  setLoading: (v) => set({ isLoading: v }),
  setActiveTab: (t) => set({ activeTab: t }),
  setTestData: (d) => set({ testData: d }),
  setCodeExamples: (e) => set({ codeExamples: e }),
  setTestResults: (r) => set({ testResults: r }),
  setDocumentation: (d) => set({ documentation: d }),
  setResponseData: (d) => set({ responseData: d }),
  addToHistory: (h) =>
    set((s) => ({ history: [h, ...s.history].slice(0, 100) })),
}));
