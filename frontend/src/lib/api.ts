import axios from "axios";
import type { ParsedAPI, ParsedEndpoint } from "../types";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const client = axios.create({
  baseURL: API,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

export const api = {
  parseUrl: (url: string) => client.post("/api/parse/url", { url }),

  parseText: (spec: string) => client.post("/api/parse/text", { spec }),

  generateTestData: (endpoint: ParsedEndpoint, parsedApi: ParsedAPI) =>
    client.post("/api/ai/test-data", { endpoint, api: parsedApi }),

  generateCodeExamples: (endpoint: ParsedEndpoint, parsedApi: ParsedAPI) =>
    client.post("/api/ai/code-examples", { endpoint, api: parsedApi }),

  generateTests: (endpoint: ParsedEndpoint, parsedApi: ParsedAPI) =>
    client.post("/api/ai/tests", { endpoint, api: parsedApi }),

  generateDocumentation: (parsedApi: ParsedAPI) =>
    client.post("/api/ai/documentation", { api: parsedApi }),

  analyzeResponse: (endpoint: ParsedEndpoint, response: any) =>
    client.post("/api/ai/analyze-response", { endpoint, response }),

  sendRequest: (config: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  }) => client.post("/api/proxy/send", config),

  runTests: (tests: any[], baseUrl: string) =>
    client.post("/api/tests/run", { tests, baseUrl }),
};
