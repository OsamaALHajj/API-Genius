import SwaggerParser from '@apidevtools/swagger-parser';
import axios from 'axios';

// ===== Types =====
export interface ParsedEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: ParameterInfo[];
  requestBody: RequestBodyInfo | null;
  responses: ResponseInfo[];
  security: string[];
}

export interface ParameterInfo {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
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

export interface ParsedAPI {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  endpoints: ParsedEndpoint[];
  schemas: Record<string, any>;
  securitySchemes: Record<string, any>;
}

export class OpenAPIParserService {

  /**
   * Parse API from URL - supports:
   * 1. Direct OpenAPI/Swagger spec URL (JSON/YAML)
   * 2. Regular URL → auto-discover spec
   */
  async parseFromUrl(url: string): Promise<ParsedAPI> {
    let specData: any;

    // Try fetching spec directly
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'Accept': 'application/json, application/yaml, text/yaml' }
      });
      specData = response.data;

      // Verify it looks like an OpenAPI spec
      if (typeof specData === 'object' && (specData.openapi || specData.swagger || specData.paths)) {
        return this.parseSpec(specData, url);
      }
    } catch {
      // Will try discovery below
    }

    // If direct fetch didn't work, try auto-discovery
    specData = await this.discoverSpec(url);
    return this.parseSpec(specData, url);
  }

  /**
   * Parse spec from text input
   */
  async parseFromText(specText: string): Promise<ParsedAPI> {
    let specData: any;
    if (typeof specText === 'string') {
      try {
        specData = JSON.parse(specText);
      } catch {
        throw new Error('Invalid JSON. Please provide valid OpenAPI/Swagger JSON.');
      }
    } else {
      specData = specText;
    }
    return this.parseSpec(specData);
  }

  /**
   * Auto-discover API spec from common paths
   */
  private async discoverSpec(baseUrl: string): Promise<any> {
    const commonPaths = [
      '/swagger.json',
      '/openapi.json',
      '/api-docs',
      '/v2/api-docs',
      '/v3/api-docs',
      '/swagger/v1/swagger.json',
      '/docs/openapi.json',
      '/.well-known/openapi.json',
      '/api/swagger.json',
      '/api/v1/swagger.json',
      '/doc.json',
    ];

    let origin: string;
    try {
      origin = new URL(baseUrl).origin;
    } catch {
      throw new Error(`Invalid URL: ${baseUrl}`);
    }

    for (const path of commonPaths) {
      try {
        const response = await axios.get(`${origin}${path}`, {
          timeout: 5000,
          validateStatus: (status: number) => status === 200
        });
        if (response.data && (response.data.openapi || response.data.swagger || response.data.paths)) {
          return response.data;
        }
      } catch {
        continue;
      }
    }

    throw new Error(
      'Could not auto-discover API specification. ' +
      'Please provide a direct URL to your OpenAPI/Swagger JSON file.'
    );
  }

  /**
   * Main spec parsing logic
   */
  private async parseSpec(specData: any, sourceUrl?: string): Promise<ParsedAPI> {
    // Dereference all $ref pointers
    const api = await SwaggerParser.dereference(specData as any) as any;

    const baseUrl = this.extractBaseUrl(api, sourceUrl);
    const endpoints: ParsedEndpoint[] = [];

    const paths = api.paths || {};
    const validMethods = ['get', 'post', 'put', 'delete', 'patch'];

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const [method, operation] of Object.entries(pathItem as Record<string, any>)) {
        if (!validMethods.includes(method)) continue;
        if (!operation || typeof operation !== 'object') continue;

        const op = operation as any;
        const endpoint: ParsedEndpoint = {
          id: `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
          method: method.toUpperCase() as ParsedEndpoint['method'],
          path,
          summary: op.summary || '',
          description: op.description || '',
          tags: op.tags || ['General'],
          parameters: this.extractParameters(op, pathItem),
          requestBody: this.extractRequestBody(op),
          responses: this.extractResponses(op),
          security: this.extractSecurity(op, api),
        };

        endpoints.push(endpoint);
      }
    }

    return {
      title: api.info?.title || 'Unknown API',
      description: api.info?.description || '',
      version: api.info?.version || '1.0.0',
      baseUrl,
      endpoints,
      schemas: api.components?.schemas || api.definitions || {},
      securitySchemes: api.components?.securitySchemes
        || api.securityDefinitions || {},
    };
  }

  private extractBaseUrl(api: any, sourceUrl?: string): string {
    // OpenAPI 3.x
    if (api.servers?.length > 0) {
      let url = api.servers[0].url;
      // Handle relative URLs
      if (url.startsWith('/') && sourceUrl) {
        try {
          url = new URL(sourceUrl).origin + url;
        } catch { /* keep as-is */ }
      }
      return url;
    }
    // Swagger 2.x
    if (api.host) {
      const scheme = api.schemes?.[0] || 'https';
      const basePath = api.basePath || '';
      return `${scheme}://${api.host}${basePath}`;
    }
    // Fallback
    if (sourceUrl) {
      try {
        return new URL(sourceUrl).origin;
      } catch { /* fallback below */ }
    }
    return 'http://localhost:3000';
  }

  private extractParameters(operation: any, pathItem: any): ParameterInfo[] {
    // Merge path-level and operation-level parameters
    const pathParams = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
    const opParams = Array.isArray(operation.parameters) ? operation.parameters : [];

    // Operation params override path params with same name+in
    const merged = [...pathParams];
    for (const opParam of opParams) {
      const idx = merged.findIndex(
        (p: any) => p.name === opParam.name && p.in === opParam.in
      );
      if (idx >= 0) {
        merged[idx] = opParam;
      } else {
        merged.push(opParam);
      }
    }

    return merged.map((param: any) => ({
      name: param.name || '',
      in: param.in || 'query',
      required: param.required || false,
      type: param.schema?.type || param.type || 'string',
      description: param.description || '',
      example: param.example ?? param.schema?.example ?? null,
      schema: param.schema || {},
    }));
  }

  private extractRequestBody(operation: any): RequestBodyInfo | null {
    // OpenAPI 3.x
    const body = operation.requestBody;
    if (body && body.content) {
      const contentType = Object.keys(body.content)[0] || 'application/json';
      const content = body.content[contentType] || {};
      return {
        contentType,
        required: body.required || false,
        schema: content.schema || {},
        example: content.example ?? content.schema?.example ?? null,
      };
    }

    // Swagger 2.x - body parameter
    const bodyParam = (operation.parameters || []).find(
      (p: any) => p.in === 'body'
    );
    if (bodyParam) {
      return {
        contentType: (operation.consumes && operation.consumes[0]) || 'application/json',
        required: bodyParam.required || false,
        schema: bodyParam.schema || {},
        example: bodyParam.schema?.example ?? null,
      };
    }

    return null;
  }

  private extractResponses(operation: any): ResponseInfo[] {
    if (!operation.responses) return [];

    return Object.entries(operation.responses).map(([code, resp]: [string, any]) => {
      // OpenAPI 3.x
      if (resp.content) {
        const contentType = Object.keys(resp.content)[0] || 'application/json';
        const content = resp.content[contentType] || {};
        return {
          statusCode: code,
          description: resp.description || '',
          schema: content.schema || {},
          example: content.example ?? content.schema?.example ?? null,
        };
      }
      // Swagger 2.x
      return {
        statusCode: code,
        description: resp.description || '',
        schema: resp.schema || {},
        example: resp.examples?.['application/json'] ?? resp.schema?.example ?? null,
      };
    });
  }

  private extractSecurity(operation: any, api: any): string[] {
    const security = operation.security ?? api.security ?? [];
    if (!Array.isArray(security)) return [];
    return security.flatMap((s: any) =>
      typeof s === 'object' && s !== null ? Object.keys(s) : []
    );
  }
}
