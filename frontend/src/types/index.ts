export interface ParameterInfo {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required: boolean;
  type: string;
  description: string;
  example: any;
  schema: any;
}

export interface RequestBodyInfo {
  contentType: string;
  required: boolean;
  schema: any;
  example: any;
}

export interface ResponseInfo {
  statusCode: string;
  description: string;
  schema: any;
  example: any;
}

export interface ParsedEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: ParameterInfo[];
  requestBody: RequestBodyInfo | null;
  responses: ResponseInfo[];
  security: string[];
}

export interface ParsedAPI {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  endpoints: ParsedEndpoint[];
  schemas: Record<string, any>;
  securitySchemes: Record<string, any>;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  time: number;
  size: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: number;
  time: number;
}

export interface TestResultItem {
  name: string;
  passed: boolean;
  assertions: { type: string; expected: any; actual: any; passed: boolean; message: string }[];
  time: number;
  status: number | null;
  responseBody: any;
  error: string | null;
}

export interface TestResults {
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: string;
    totalTime: number;
  };
  results: TestResultItem[];
}
