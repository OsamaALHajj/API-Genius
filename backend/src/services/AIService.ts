import OpenAI from 'openai';
import type { ParsedAPI, ParsedEndpoint } from './OpenAPIParser.js';

export class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate smart test data for an endpoint
   */
  async generateTestData(endpoint: ParsedEndpoint, api: ParsedAPI): Promise<any> {
    const prompt = `You are an API testing expert. Generate comprehensive test data for this endpoint:

## Endpoint
- Method: ${endpoint.method}
- Path: ${endpoint.path}
- Summary: ${endpoint.summary}

## Parameters
${JSON.stringify(endpoint.parameters, null, 2)}

## Request Body Schema
${JSON.stringify(endpoint.requestBody?.schema || 'None', null, 2)}

## Expected Responses
${JSON.stringify(endpoint.responses, null, 2)}

Generate a JSON object containing:
1. "happyPath": 3 examples of valid data
2. "edgeCases": edge cases (empty fields, very large values, special characters)
3. "errorCases": invalid data to test error handling
4. "securityTests": security test patterns (SQL injection patterns, XSS, etc.)
5. "boundaryValues": boundary values (0, -1, MAX_INT, very long strings)

Return ONLY valid JSON, no explanation.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');
    return JSON.parse(content);
  }

  /**
   * Generate code examples in multiple languages
   */
  async generateCodeExamples(
    endpoint: ParsedEndpoint,
    api: ParsedAPI
  ): Promise<Record<string, string>> {
    const languages = [
      'JavaScript (fetch)',
      'JavaScript (axios)',
      'Python (requests)',
      'Python (httpx)',
      'cURL',
      'PHP (Guzzle)',
      'Java (HttpClient)',
      'Go (net/http)',
      'Rust (reqwest)',
      'C# (HttpClient)',
      'Ruby (Net::HTTP)',
      'Swift (URLSession)',
      'Kotlin (OkHttp)',
      'Dart (http)',
    ];

    const prompt = `Generate code examples for this API endpoint in ALL these languages:
${languages.join(', ')}

## Endpoint
- Base URL: ${api.baseUrl}
- Method: ${endpoint.method}
- Path: ${endpoint.path}
- Content-Type: ${endpoint.requestBody?.contentType || 'application/json'}

## Parameters
${JSON.stringify(endpoint.parameters, null, 2)}

## Request Body Example
${JSON.stringify(endpoint.requestBody?.example || endpoint.requestBody?.schema || {}, null, 2)}

## Auth
${endpoint.security.length > 0 ? `Requires: ${endpoint.security.join(', ')}` : 'No auth required'}

Return a JSON object where each key is the language name and the value is the complete, working code example as a string. Include error handling in each example.
Return ONLY valid JSON.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');
    return JSON.parse(content);
  }

  /**
   * Generate test suites
   */
  async generateTests(
    endpoint: ParsedEndpoint,
    api: ParsedAPI
  ): Promise<{ jest: string; mocha: string; pytest: string }> {
    const prompt = `Generate comprehensive API test suites for this endpoint:

## Endpoint
- Base URL: ${api.baseUrl}
- Method: ${endpoint.method}
- Path: ${endpoint.path}

## Parameters
${JSON.stringify(endpoint.parameters, null, 2)}

## Request Body
${JSON.stringify(endpoint.requestBody, null, 2)}

## Expected Responses
${JSON.stringify(endpoint.responses, null, 2)}

Generate THREE test suites:

1. "jest": Complete Jest test file (JavaScript) with happy path, error handling, validation, edge case, and response schema tests

2. "mocha": Complete Mocha + Chai test file (JavaScript)

3. "pytest": Complete pytest test file (Python) with requests library

Each test suite should have at least 8-10 test cases.
Return JSON with keys: jest, mocha, pytest. Values are complete code strings.
Return ONLY valid JSON.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');
    return JSON.parse(content);
  }

  /**
   * Generate full API documentation
   */
  async generateDocumentation(api: ParsedAPI): Promise<string> {
    const endpointSummaries = api.endpoints.map(e =>
      `### ${e.method} ${e.path}\n- Summary: ${e.summary}\n- Tags: ${e.tags.join(', ')}\n- Params: ${e.parameters.map(p => p.name).join(', ') || 'none'}\n- Body: ${e.requestBody ? 'yes' : 'no'}`
    ).join('\n\n');

    const prompt = `Generate beautiful, comprehensive API documentation in Markdown for:

## API Info
- Title: ${api.title}
- Version: ${api.version}
- Base URL: ${api.baseUrl}
- Description: ${api.description}

## Endpoints (${api.endpoints.length} total)
${endpointSummaries}

## Security Schemes
${JSON.stringify(api.securitySchemes, null, 2)}

Generate a complete, professional API documentation in Markdown including:
1. Overview and getting started
2. Authentication guide
3. Each endpoint with: Description, Parameters table, Request/Response examples, Error codes
4. Rate limiting section
5. Best practices
6. Changelog placeholder

Make it developer-friendly with clear examples.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 8000,
    });

    return response.choices[0]?.message?.content || '# Documentation generation failed';
  }

  /**
   * Analyze API response
   */
  async analyzeResponse(
    endpoint: ParsedEndpoint,
    responseData: {
      status: number;
      headers: Record<string, string>;
      body: any;
      time: number;
    }
  ): Promise<any> {
    const bodyStr = JSON.stringify(responseData.body);
    const truncatedBody = bodyStr.length > 3000 ? bodyStr.substring(0, 3000) + '...' : bodyStr;

    const prompt = `Analyze this API response and provide insights:

## Request
- ${endpoint.method} ${endpoint.path}

## Response
- Status: ${responseData.status}
- Time: ${responseData.time}ms
- Headers: ${JSON.stringify(responseData.headers)}
- Body: ${truncatedBody}

## Expected from spec
${JSON.stringify(endpoint.responses, null, 2)}

Provide analysis as JSON:
{
  "statusAnalysis": "is the status code correct and why",
  "performanceRating": "fast/normal/slow with explanation",
  "securityIssues": ["list of security concerns from headers/response"],
  "dataQuality": "analysis of response data quality",
  "suggestions": ["improvement suggestions"],
  "matchesSpec": true or false,
  "specDifferences": ["differences from the OpenAPI spec if any"]
}

Return ONLY valid JSON.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');
    return JSON.parse(content);
  }
}
