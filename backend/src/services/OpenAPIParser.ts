import SwaggerParser from "@apidevtools/swagger-parser";
import axios from "axios";

// ===== Types =====
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

// ===== Helper: check if data is an OpenAPI spec =====
function isSpec(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  return !!(data.openapi || data.swagger || data.paths);
}

// ===== Helper: try parsing string as JSON =====
function tryParseJSON(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ===== Helper: try parsing YAML =====
function tryParseYAML(text: string): any | null {
  // Simple YAML detection: check for common OpenAPI YAML patterns
  if (
    text.includes("openapi:") ||
    text.includes("swagger:") ||
    text.includes("paths:")
  ) {
    try {
      // swagger-parser can handle YAML internally, but we need to detect it
      return { __raw_yaml: text };
    } catch {
      return null;
    }
  }
  return null;
}

export class OpenAPIParserService {
  async parseFromUrl(url: string): Promise<ParsedAPI> {
    console.log(`\n📡 Parsing API from: ${url}`);

    // ========== Strategy 1: Let swagger-parser handle the URL directly ==========
    try {
      console.log("  → Strategy 1: Direct swagger-parser.dereference(url)");
      const api = await SwaggerParser.dereference(url);
      if (isSpec(api)) {
        console.log("  ✅ Strategy 1 succeeded!");
        return this.buildParsedAPI(api, url);
      }
    } catch (err: any) {
      console.log(`  ⚠️ Strategy 1 failed: ${err.message?.substring(0, 100)}`);
    }

    // ========== Strategy 2: Fetch URL and parse response ==========
    let fetchedData: any = null;
    let fetchError: string = "";

    try {
      console.log("  → Strategy 2: Fetch URL with axios");
      const resp = await axios.get(url, {
        timeout: 20000,
        headers: {
          Accept: "application/json, application/yaml, text/yaml, text/plain, */*",
          "User-Agent": "API-Genius/1.0",
        },
        // Follow redirects
        maxRedirects: 5,
        // Accept any status to see the real error
        validateStatus: () => true,
      });

      console.log(`  → Got status: ${resp.status}`);

      if (resp.status === 404) {
        fetchError = `URL returned 404 Not Found. The API spec does not exist at this URL.`;
      } else if (resp.status === 401 || resp.status === 403) {
        fetchError = `URL returned ${resp.status}. The API spec requires authentication.`;
      } else if (resp.status >= 400) {
        fetchError = `URL returned HTTP ${resp.status}.`;
      } else {
        // Status is OK, check the data
        let data = resp.data;

        // If response is a string, try to parse it
        if (typeof data === "string") {
          const jsonParsed = tryParseJSON(data);
          if (jsonParsed) {
            data = jsonParsed;
          } else if (data.includes("openapi:") || data.includes("swagger:")) {
            // YAML content - let swagger-parser handle it
            try {
              const api = await SwaggerParser.dereference(url);
              if (isSpec(api)) {
                console.log("  ✅ Strategy 2 (YAML via parser) succeeded!");
                return this.buildParsedAPI(api, url);
              }
            } catch {}
          }
        }

        if (isSpec(data)) {
          console.log("  ✅ Strategy 2 succeeded!");
          return this.buildParsedAPI(
            await this.safeDereference(data),
            url
          );
        } else {
          fetchError = `URL returned data but it doesn't look like an OpenAPI/Swagger spec.`;
        }
      }
    } catch (err: any) {
      if (err.code === "ECONNREFUSED") {
        fetchError = `Cannot connect to ${url}. Is the server running?`;
      } else if (err.code === "ENOTFOUND") {
        fetchError = `Domain not found: ${url}`;
      } else if (err.code === "ETIMEDOUT" || err.message?.includes("timeout")) {
        fetchError = `Connection to ${url} timed out.`;
      } else {
        fetchError = `Failed to fetch ${url}: ${err.message}`;
      }
      console.log(`  ⚠️ Strategy 2 failed: ${fetchError}`);
    }

    // ========== Strategy 3: Auto-discover spec from common paths ==========
    console.log("  → Strategy 3: Auto-discover from common paths");
    const discovered = await this.discoverSpec(url);
    if (discovered) {
      console.log("  ✅ Strategy 3 succeeded!");
      return this.buildParsedAPI(
        await this.safeDereference(discovered.data),
        discovered.foundAt
      );
    }

    // ========== All strategies failed ==========
    const errorMsg = fetchError
      ? `${fetchError}\n\nAlso tried auto-discovery but found nothing. Please provide a direct URL to an OpenAPI/Swagger JSON/YAML file.`
      : `Could not find API specification at ${url}. Please provide a direct URL to an OpenAPI/Swagger JSON/YAML file.`;

    throw new Error(errorMsg);
  }

  async parseFromText(text: string): Promise<ParsedAPI> {
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON provided");
    }
    if (!isSpec(data)) {
      throw new Error("The provided JSON does not appear to be an OpenAPI/Swagger spec.");
    }
    return this.buildParsedAPI(await this.safeDereference(data));
  }

  // ===== Safe dereference with fallback =====
  private async safeDereference(specData: any): Promise<any> {
    try {
      return await SwaggerParser.dereference(specData);
    } catch (err: any) {
      console.log(`  ⚠️ Dereference warning: ${err.message?.substring(0, 80)}`);
      // Return raw spec as fallback
      return specData;
    }
  }

  // ===== Auto-discover spec from base URL =====
  private async discoverSpec(
    baseUrl: string
  ): Promise<{ data: any; foundAt: string } | null> {
    let origin: string;
    try {
      const parsed = new URL(baseUrl);
      origin = parsed.origin;
    } catch {
      return null;
    }

    const commonPaths = [
      "/swagger.json",
      "/openapi.json",
      "/api-docs",
      "/v2/api-docs",
      "/v3/api-docs",
      "/swagger/v1/swagger.json",
      "/swagger/v2/swagger.json",
      "/docs/openapi.json",
      "/api/swagger.json",
      "/api/v1/swagger.json",
      "/api/openapi.json",
      "/doc.json",
      "/api-docs.json",
      "/.well-known/openapi.json",
      "/openapi/v3/api-docs",
      "/swagger-resources/configuration/ui",
    ];

    for (const path of commonPaths) {
      const tryUrl = `${origin}${path}`;
      try {
        const resp = await axios.get(tryUrl, {
          timeout: 5000,
          validateStatus: (s) => s === 200,
          headers: { Accept: "application/json, */*" },
        });
        if (isSpec(resp.data)) {
          console.log(`  🔍 Found spec at: ${tryUrl}`);
          return { data: resp.data, foundAt: tryUrl };
        }
      } catch {
        // Silent - try next
      }
    }

    // Also try swagger-parser directly on common paths
    for (const path of ["/swagger.json", "/openapi.json"]) {
      const tryUrl = `${origin}${path}`;
      try {
        const api = await SwaggerParser.dereference(tryUrl);
        if (isSpec(api)) {
          console.log(`  🔍 Found spec (via parser) at: ${tryUrl}`);
          return { data: api, foundAt: tryUrl };
        }
      } catch {
        // Silent
      }
    }

    return null;
  }

  // ===== Build the ParsedAPI from raw spec =====
  private buildParsedAPI(api: any, sourceUrl?: string): ParsedAPI {
    const baseUrl = this.getBaseUrl(api, sourceUrl);
    const endpoints: ParsedEndpoint[] = [];
    const validMethods = ["get", "post", "put", "delete", "patch"];
    const paths = api.paths || {};

    for (const [pathStr, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;

      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (!validMethods.includes(method)) continue;
        if (!operation || typeof operation !== "object") continue;

        const op = operation as any;

        endpoints.push({
          id: `${method.toUpperCase()}_${pathStr.replace(/[^a-zA-Z0-9]/g, "_")}`,
          method: method.toUpperCase() as any,
          path: pathStr,
          summary: op.summary || "",
          description: op.description || "",
          tags: Array.isArray(op.tags) && op.tags.length > 0 ? op.tags : ["General"],
          parameters: this.getParams(op, pathItem as any),
          requestBody: this.getRequestBody(op),
          responses: this.getResponses(op),
          security: this.getSecurity(op, api),
        });
      }
    }

    console.log(`  📊 Parsed ${endpoints.length} endpoints from "${api.info?.title || "API"}"`);

    return {
      title: api.info?.title || "Unknown API",
      description: api.info?.description || "",
      version: api.info?.version || "1.0.0",
      baseUrl,
      endpoints,
      schemas: api.components?.schemas || api.definitions || {},
      securitySchemes:
        api.components?.securitySchemes || api.securityDefinitions || {},
    };
  }

  private getBaseUrl(api: any, sourceUrl?: string): string {
    if (api.servers && api.servers.length > 0) {
      let url = api.servers[0].url;
      if (url.startsWith("/") && sourceUrl) {
        try { url = new URL(sourceUrl).origin + url; } catch {}
      }
      return url;
    }
    if (api.host) {
      const scheme = (api.schemes && api.schemes[0]) || "https";
      return `${scheme}://${api.host}${api.basePath || ""}`;
    }
    if (sourceUrl) {
      try { return new URL(sourceUrl).origin; } catch {}
    }
    return "http://localhost:3000";
  }

  private getParams(op: any, pathItem: any): ParameterInfo[] {
    const pathParams: any[] = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
    const opParams: any[] = Array.isArray(op.parameters) ? op.parameters : [];

    const merged = [...pathParams];
    for (const p of opParams) {
      const idx = merged.findIndex((m: any) => m.name === p.name && m.in === p.in);
      if (idx >= 0) merged[idx] = p;
      else merged.push(p);
    }

    return merged
      .filter((p: any) => p.in !== "body")
      .map((p: any) => ({
        name: p.name || "",
        in: p.in || "query",
        required: !!p.required,
        type: p.schema?.type || p.type || "string",
        description: p.description || "",
        example: p.example ?? p.schema?.example ?? null,
        schema: p.schema || {},
      }));
  }

  private getRequestBody(op: any): RequestBodyInfo | null {
    if (op.requestBody?.content) {
      const ct = Object.keys(op.requestBody.content)[0] || "application/json";
      const schema = op.requestBody.content[ct]?.schema || {};
      return {
        contentType: ct,
        required: !!op.requestBody.required,
        schema,
        example: op.requestBody.content[ct]?.example ?? schema.example ?? null,
      };
    }
    if (Array.isArray(op.parameters)) {
      const bodyParam = op.parameters.find((p: any) => p.in === "body");
      if (bodyParam) {
        return {
          contentType: (op.consumes && op.consumes[0]) || "application/json",
          required: !!bodyParam.required,
          schema: bodyParam.schema || {},
          example: bodyParam.schema?.example ?? null,
        };
      }
    }
    return null;
  }

  private getResponses(op: any): ResponseInfo[] {
    if (!op.responses) return [];
    return Object.entries(op.responses).map(([code, resp]: [string, any]) => {
      if (resp.content) {
        const ct = Object.keys(resp.content)[0] || "application/json";
        const schema = resp.content[ct]?.schema || {};
        return {
          statusCode: code,
          description: resp.description || "",
          schema,
          example: resp.content[ct]?.example ?? schema.example ?? null,
        };
      }
      return {
        statusCode: code,
        description: resp.description || "",
        schema: resp.schema || {},
        example: resp.examples?.["application/json"] ?? null,
      };
    });
  }

  private getSecurity(op: any, api: any): string[] {
    const sec = op.security ?? api.security ?? [];
    if (!Array.isArray(sec)) return [];
    return sec.flatMap((s: any) => (s && typeof s === "object" ? Object.keys(s) : []));
  }
}
