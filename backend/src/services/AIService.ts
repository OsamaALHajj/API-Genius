import type { ParsedAPI, ParsedEndpoint } from "./OpenAPIParser";

// ===== AI Provider Interface =====
interface AIProvider {
  name: string;
  chat(prompt: string, jsonMode: boolean): Promise<string>;
}

// ===== Provider 1: Google Gemini (FREE) =====
class GeminiProvider implements AIProvider {
  name = "Google Gemini";
  private model: any;

  constructor(apiKey: string) {
    // Dynamic import workaround
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async chat(prompt: string, jsonMode: boolean): Promise<string> {
    const fullPrompt = jsonMode
      ? prompt + "\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no backticks, no explanation."
      : prompt;

    const result = await this.model.generateContent(fullPrompt);
    let text = result.response.text();

    // Clean JSON from markdown code blocks if present
    if (jsonMode) {
      text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    }

    return text;
  }
}

// ===== Provider 2: Groq (FREE) =====
class GroqProvider implements AIProvider {
  name = "Groq";
  private client: any;

  constructor(apiKey: string) {
    const Groq = require("groq-sdk");
    this.client = new Groq({ apiKey });
  }

  async chat(prompt: string, jsonMode: boolean): Promise<string> {
    const resp = await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    });
    return resp.choices[0]?.message?.content || "";
  }
}

// ===== Provider 3: OpenAI (PAID) =====
class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  private client: any;

  constructor(apiKey: string) {
    const OpenAI = require("openai");
    this.client = new OpenAI.default({ apiKey });
  }

  async chat(prompt: string, jsonMode: boolean): Promise<string> {
    const resp = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    });
    return resp.choices[0]?.message?.content || "";
  }
}

// ===== Provider 4: No AI - Smart Local Generation =====
class LocalProvider implements AIProvider {
  name = "Local (No AI)";

  async chat(prompt: string, _jsonMode: boolean): Promise<string> {
    // This won't be called directly - each method has local fallback
    return "{}";
  }
}

// ===== Main AI Service =====
export class AIService {
  private provider: AIProvider;

  constructor() {
    // Auto-detect provider from environment
    if (process.env.GEMINI_API_KEY) {
      this.provider = new GeminiProvider(process.env.GEMINI_API_KEY);
      console.log("🤖 AI Provider: Google Gemini (FREE)");
    } else if (process.env.GROQ_API_KEY) {
      this.provider = new GroqProvider(process.env.GROQ_API_KEY);
      console.log("🤖 AI Provider: Groq (FREE)");
    } else if (process.env.OPENAI_API_KEY) {
      this.provider = new OpenAIProvider(process.env.OPENAI_API_KEY);
      console.log("🤖 AI Provider: OpenAI");
    } else {
      this.provider = new LocalProvider();
      console.log("🤖 AI Provider: Local (No AI key found - using smart generation)");
    }
  }

  getProviderName(): string {
    return this.provider.name;
  }

  // ===== Generate Test Data =====
  async generateTestData(ep: ParsedEndpoint, api: ParsedAPI): Promise<any> {
    // If no AI, use smart local generation
    if (this.provider instanceof LocalProvider) {
      return this.localTestData(ep);
    }

    const prompt = `You are an API testing expert. Generate test data for:
Method: ${ep.method} ${ep.path}
Summary: ${ep.summary}
Parameters: ${JSON.stringify(ep.parameters)}
Request Body Schema: ${JSON.stringify(ep.requestBody?.schema || "None")}

Return JSON with:
- "happyPath": array of 3 valid request body examples
- "edgeCases": array of 3 edge case examples (empty strings, nulls, special chars)
- "errorCases": array of 3 invalid data examples
- "securityTests": array of 3 security test payloads (SQL injection strings, XSS, etc)
- "boundaryValues": array of 3 boundary value examples (0, negative, very large)

Return ONLY valid JSON.`;

    try {
      const text = await this.provider.chat(prompt, true);
      return JSON.parse(text);
    } catch (err) {
      console.log("AI failed, falling back to local generation");
      return this.localTestData(ep);
    }
  }

  // ===== Generate Code Examples =====
  async generateCodeExamples(ep: ParsedEndpoint, api: ParsedAPI): Promise<Record<string, string>> {
    if (this.provider instanceof LocalProvider) {
      return this.localCodeExamples(ep, api);
    }

    const prompt = `Generate working code examples for this API endpoint in ALL these languages:
JavaScript (fetch), JavaScript (axios), Python (requests), cURL, PHP (Guzzle), Java (HttpClient), Go (net/http), C# (HttpClient), Ruby (Net::HTTP), Swift (URLSession), Kotlin (OkHttp), Dart (http)

Endpoint:
- Base URL: ${api.baseUrl}
- Method: ${ep.method}
- Path: ${ep.path}
- Content-Type: ${ep.requestBody?.contentType || "application/json"}
- Parameters: ${JSON.stringify(ep.parameters)}
- Body Schema: ${JSON.stringify(ep.requestBody?.schema || {})}
- Auth: ${ep.security.length > 0 ? ep.security.join(", ") : "none"}

Return JSON object: keys = language name, values = complete code string.
Return ONLY valid JSON.`;

    try {
      const text = await this.provider.chat(prompt, true);
      return JSON.parse(text);
    } catch (err) {
      console.log("AI failed, falling back to local generation");
      return this.localCodeExamples(ep, api);
    }
  }

  // ===== Generate Tests =====
  async generateTests(ep: ParsedEndpoint, api: ParsedAPI): Promise<{ jest: string; mocha: string; pytest: string }> {
    if (this.provider instanceof LocalProvider) {
      return this.localTests(ep, api);
    }

    const prompt = `Generate 3 API test suites for:
Base URL: ${api.baseUrl}
${ep.method} ${ep.path}
Parameters: ${JSON.stringify(ep.parameters)}
Body: ${JSON.stringify(ep.requestBody)}
Responses: ${JSON.stringify(ep.responses)}

Return JSON with:
- "jest": complete Jest test file string (8+ tests)
- "mocha": complete Mocha+Chai test file string (8+ tests)
- "pytest": complete pytest file string (8+ tests)

Return ONLY valid JSON.`;

    try {
      const text = await this.provider.chat(prompt, true);
      return JSON.parse(text);
    } catch (err) {
      console.log("AI failed, falling back to local generation");
      return this.localTests(ep, api);
    }
  }

  // ===== Generate Documentation =====
  async generateDocumentation(api: ParsedAPI): Promise<string> {
    if (this.provider instanceof LocalProvider) {
      return this.localDocumentation(api);
    }

    const endpointList = api.endpoints
      .map((e) => `- ${e.method} ${e.path}: ${e.summary} [${e.tags.join(",")}]`)
      .join("\n");

    const prompt = `Generate complete professional Markdown API documentation for:
Title: ${api.title} v${api.version}
Base URL: ${api.baseUrl}
Description: ${api.description}
Security: ${JSON.stringify(api.securitySchemes)}

Endpoints (${api.endpoints.length}):
${endpointList}

Include: Overview, Authentication guide, each endpoint with description/params/examples/errors, best practices.
Write in Markdown format.`;

    try {
      return await this.provider.chat(prompt, false);
    } catch (err) {
      console.log("AI failed, falling back to local generation");
      return this.localDocumentation(api);
    }
  }

  // ===== Analyze Response =====
  async analyzeResponse(ep: ParsedEndpoint, responseData: any): Promise<any> {
    if (this.provider instanceof LocalProvider) {
      return this.localAnalysis(ep, responseData);
    }

    const prompt = `Analyze this API response:
Request: ${ep.method} ${ep.path}
Status: ${responseData.status}, Time: ${responseData.time}ms
Body (truncated): ${JSON.stringify(responseData.body).substring(0, 2000)}
Expected: ${JSON.stringify(ep.responses)}

Return JSON: { statusAnalysis, performanceRating, securityIssues[], dataQuality, suggestions[], matchesSpec, specDifferences[] }`;

    try {
      const text = await this.provider.chat(prompt, true);
      return JSON.parse(text);
    } catch (err) {
      return this.localAnalysis(ep, responseData);
    }
  }

  // ============================================================
  // ===== LOCAL SMART GENERATION (No AI needed!) ==============
  // ============================================================

  private localTestData(ep: ParsedEndpoint): any {
    const schema = ep.requestBody?.schema || {};
    const props = schema.properties || {};

    const generateSample = (variant: "happy" | "edge" | "error" | "security" | "boundary") => {
      const obj: any = {};
      for (const [key, val] of Object.entries(props) as [string, any][]) {
        const type = val.type || "string";
        switch (variant) {
          case "happy":
            if (type === "string") obj[key] = val.example || `test_${key}`;
            else if (type === "integer" || type === "number") obj[key] = val.example || 1;
            else if (type === "boolean") obj[key] = true;
            else if (type === "array") obj[key] = [val.items?.example || "item1"];
            else obj[key] = val.example || `value_${key}`;
            break;
          case "edge":
            if (type === "string") obj[key] = "";
            else if (type === "integer" || type === "number") obj[key] = 0;
            else if (type === "boolean") obj[key] = null;
            else obj[key] = null;
            break;
          case "error":
            if (type === "string") obj[key] = 12345;
            else if (type === "integer" || type === "number") obj[key] = "not_a_number";
            else if (type === "boolean") obj[key] = "not_boolean";
            else obj[key] = { invalid: true };
            break;
          case "security":
            if (type === "string") obj[key] = "'; DROP TABLE users; --";
            else obj[key] = "<script>alert('xss')</script>";
            break;
          case "boundary":
            if (type === "integer" || type === "number") obj[key] = 2147483647;
            else if (type === "string") obj[key] = "a".repeat(10000);
            else obj[key] = val.example || key;
            break;
        }
      }
      return Object.keys(obj).length > 0 ? obj : { id: 1, name: "test" };
    };

    return {
      happyPath: [generateSample("happy"), { ...generateSample("happy"), id: 2 }, { ...generateSample("happy"), id: 3 }],
      edgeCases: [generateSample("edge"), { ...generateSample("edge") }, {}],
      errorCases: [generateSample("error"), null, "invalid_string_body"],
      securityTests: [generateSample("security"), { input: "' OR 1=1 --" }, { input: "<img src=x onerror=alert(1)>" }],
      boundaryValues: [generateSample("boundary"), { value: -1 }, { value: Number.MAX_SAFE_INTEGER }],
    };
  }

  private localCodeExamples(ep: ParsedEndpoint, api: ParsedAPI): Record<string, string> {
    const url = `${api.baseUrl}${ep.path}`;
    const method = ep.method;
    const hasBody = ep.requestBody !== null;
    const bodyExample = hasBody ? JSON.stringify({ id: 1, name: "example" }, null, 2) : "";

    return {
      "JavaScript (fetch)": `const response = await fetch('${url}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',
  },${hasBody ? `\n  body: JSON.stringify(${bodyExample}),` : ""}
});

const data = await response.json();
console.log(data);`,

      "JavaScript (axios)": `import axios from 'axios';

const { data } = await axios.${method.toLowerCase()}('${url}'${hasBody ? `,\n  ${bodyExample}` : ""});
console.log(data);`,

      "Python (requests)": `import requests

response = requests.${method.toLowerCase()}(
    '${url}',
    headers={'Content-Type': 'application/json'},${hasBody ? `\n    json=${bodyExample.replace(/"/g, "'")},` : ""}
)

print(response.status_code)
print(response.json())`,

      "cURL": `curl -X ${method} '${url}' \\
  -H 'Content-Type: application/json'${hasBody ? ` \\\n  -d '${bodyExample.replace(/\n/g, "")}'` : ""}`,

      "PHP (Guzzle)": `<?php
use GuzzleHttp\\Client;

$client = new Client();
$response = $client->request('${method}', '${url}', [
    'headers' => ['Content-Type' => 'application/json'],${hasBody ? `\n    'json' => json_decode('${bodyExample.replace(/\n/g, "")}', true),` : ""}
]);

echo $response->getBody();`,

      "Java (HttpClient)": `HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${url}"))
    .header("Content-Type", "application/json")
    .method("${method}", ${hasBody ? `HttpRequest.BodyPublishers.ofString("${bodyExample.replace(/\n/g, "").replace(/"/g, '\\"')}")` : "HttpRequest.BodyPublishers.noBody()"})
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,

      "Go (net/http)": `package main

import (
    "fmt"
    "net/http"${hasBody ? '\n    "strings"' : ""}
    "io"
)

func main() {
    ${hasBody ? `body := strings.NewReader(\`${bodyExample}\`)
    req, _ := http.NewRequest("${method}", "${url}", body)` : `req, _ := http.NewRequest("${method}", "${url}", nil)`}
    req.Header.Set("Content-Type", "application/json")
    
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    data, _ := io.ReadAll(resp.Body)
    fmt.Println(string(data))
}`,

      "C# (HttpClient)": `using var client = new HttpClient();
${hasBody ? `var content = new StringContent(@"${bodyExample.replace(/\n/g, "")}", System.Text.Encoding.UTF8, "application/json");
var response = await client.${method === "GET" ? "GetAsync" : method === "POST" ? "PostAsync" : method === "PUT" ? "PutAsync" : "DeleteAsync"}("${url}"${method !== "GET" && method !== "DELETE" ? ", content" : ""});` : `var response = await client.${method === "GET" ? "GetAsync" : "DeleteAsync"}("${url}");`}
var body = await response.Content.ReadAsStringAsync();
Console.WriteLine(body);`,

      "Ruby (Net::HTTP)": `require 'net/http'
require 'json'

uri = URI('${url}')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = uri.scheme == 'https'

request = Net::HTTP::${method === "GET" ? "Get" : method === "POST" ? "Post" : method === "PUT" ? "Put" : method === "DELETE" ? "Delete" : "Patch"}.new(uri)
request['Content-Type'] = 'application/json'${hasBody ? `\nrequest.body = '${bodyExample.replace(/\n/g, "")}'` : ""}

response = http.request(request)
puts response.body`,
    };
  }

  private localTests(ep: ParsedEndpoint, api: ParsedAPI): { jest: string; mocha: string; pytest: string } {
    const url = `${api.baseUrl}${ep.path}`;
    const method = ep.method.toLowerCase();

    return {
      jest: `const axios = require('axios');

const BASE_URL = '${api.baseUrl}';

describe('${ep.method} ${ep.path}', () => {
  test('should respond with a status code', async () => {
    const res = await axios.${method}('${url}', { validateStatus: () => true });
    expect(res.status).toBeDefined();
  });

  test('should respond within 5 seconds', async () => {
    const start = Date.now();
    await axios.${method}('${url}', { validateStatus: () => true });
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test('should return valid JSON', async () => {
    const res = await axios.${method}('${url}', { validateStatus: () => true });
    expect(typeof res.data).not.toBe('undefined');
  });

  test('should have content-type header', async () => {
    const res = await axios.${method}('${url}', { validateStatus: () => true });
    expect(res.headers['content-type']).toBeDefined();
  });

  test('should return 404 for invalid path', async () => {
    const res = await axios.get('${api.baseUrl}/invalid_path_999', { validateStatus: () => true });
    expect(res.status).toBe(404);
  });
});`,

      mocha: `const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = '${api.baseUrl}';

describe('${ep.method} ${ep.path}', () => {
  it('should respond', async () => {
    const res = await axios.${method}('${url}', { validateStatus: () => true });
    expect(res.status).to.be.a('number');
  });

  it('should be fast', async () => {
    const start = Date.now();
    await axios.${method}('${url}', { validateStatus: () => true });
    expect(Date.now() - start).to.be.below(5000);
  });

  it('should return data', async () => {
    const res = await axios.${method}('${url}', { validateStatus: () => true });
    expect(res.data).to.exist;
  });
});`,

      pytest: `import requests
import time

BASE_URL = '${api.baseUrl}'

def test_responds():
    r = requests.${method}('${url}')
    assert r.status_code is not None

def test_fast_response():
    start = time.time()
    requests.${method}('${url}')
    assert (time.time() - start) < 5

def test_returns_data():
    r = requests.${method}('${url}')
    assert r.text is not None

def test_invalid_path_404():
    r = requests.get(f'{BASE_URL}/invalid_path_999')
    assert r.status_code == 404`,
    };
  }

  private localDocumentation(api: ParsedAPI): string {
    let doc = `# ${api.title}\n\n`;
    doc += `**Version:** ${api.version}  \n`;
    doc += `**Base URL:** \`${api.baseUrl}\`\n\n`;

    if (api.description) {
      doc += `## Overview\n\n${api.description}\n\n`;
    }

    // Auth
    const authSchemes = Object.entries(api.securitySchemes);
    if (authSchemes.length > 0) {
      doc += `## Authentication\n\n`;
      for (const [name, scheme] of authSchemes) {
        const s = scheme as any;
        doc += `### ${name}\n`;
        doc += `- Type: \`${s.type}\`\n`;
        if (s.in) doc += `- In: \`${s.in}\`\n`;
        if (s.name) doc += `- Name: \`${s.name}\`\n`;
        doc += `\n`;
      }
    }

    // Group by tag
    const tags: Record<string, typeof api.endpoints> = {};
    api.endpoints.forEach((ep) => {
      const tag = ep.tags[0] || "General";
      (tags[tag] ??= []).push(ep);
    });

    doc += `## Endpoints\n\n`;

    for (const [tag, eps] of Object.entries(tags)) {
      doc += `### ${tag}\n\n`;

      for (const ep of eps) {
        doc += `#### \`${ep.method} ${ep.path}\`\n\n`;
        if (ep.summary) doc += `${ep.summary}\n\n`;
        if (ep.description) doc += `${ep.description}\n\n`;

        if (ep.parameters.length > 0) {
          doc += `**Parameters:**\n\n`;
          doc += `| Name | In | Type | Required | Description |\n`;
          doc += `|------|-----|------|----------|-------------|\n`;
          ep.parameters.forEach((p) => {
            doc += `| ${p.name} | ${p.in} | ${p.type} | ${p.required ? "Yes" : "No"} | ${p.description} |\n`;
          });
          doc += `\n`;
        }

        if (ep.requestBody) {
          doc += `**Request Body:** \`${ep.requestBody.contentType}\`\n\n`;
          doc += `\`\`\`json\n${JSON.stringify(ep.requestBody.schema, null, 2)}\n\`\`\`\n\n`;
        }

        if (ep.responses.length > 0) {
          doc += `**Responses:**\n\n`;
          ep.responses.forEach((r) => {
            doc += `- **${r.statusCode}**: ${r.description}\n`;
          });
          doc += `\n`;
        }

        doc += `---\n\n`;
      }
    }

    return doc;
  }

  private localAnalysis(ep: ParsedEndpoint, responseData: any): any {
    const time = responseData.time || 0;
    const status = responseData.status || 0;

    let perfRating = "fast";
    if (time > 1000) perfRating = "normal";
    if (time > 3000) perfRating = "slow";

    const expectedStatuses = ep.responses.map((r) => parseInt(r.statusCode)).filter((n) => !isNaN(n));
    const matchesSpec = expectedStatuses.length === 0 || expectedStatuses.includes(status);

    return {
      statusAnalysis: `${status >= 200 && status < 300 ? "Success" : status >= 400 ? "Error" : "Redirect"} - Status ${status}`,
      performanceRating: `${perfRating} (${time}ms)`,
      securityIssues: [],
      dataQuality: responseData.body ? "Response contains data" : "Empty response",
      suggestions: time > 2000 ? ["Consider optimizing response time"] : ["Response looks good"],
      matchesSpec,
      specDifferences: matchesSpec ? [] : [`Status ${status} not in expected: ${expectedStatuses.join(", ")}`],
    };
  }
}
