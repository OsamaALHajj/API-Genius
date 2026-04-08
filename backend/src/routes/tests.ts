import { Router, Request, Response } from "express";
import axios from "axios";

export const testsRouter = Router();

// ===== Types =====
interface TestAssertion {
  type: "status" | "body" | "header" | "time";
  path?: string;
  operator: "eq" | "ne" | "gt" | "lt" | "contains" | "exists";
  value: any;
}

interface TestCase {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number;
  assertions?: TestAssertion[];
}

// ===== Helpers (standalone functions - NOT this.) =====
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((cur, key) => {
    if (cur == null) return undefined;
    return cur[key];
  }, obj);
}

function runAssertion(
  a: TestAssertion,
  resp: { status: number; headers: any; data: any },
  time: number
) {
  let actual: any;
  switch (a.type) {
    case "status":
      actual = resp.status;
      break;
    case "body":
      actual = a.path ? getNestedValue(resp.data, a.path) : resp.data;
      break;
    case "header":
      actual = a.path ? resp.headers[a.path.toLowerCase()] : resp.headers;
      break;
    case "time":
      actual = time;
      break;
  }

  let passed = false;
  switch (a.operator) {
    case "eq":
      passed = actual === a.value;
      break;
    case "ne":
      passed = actual !== a.value;
      break;
    case "gt":
      passed = actual > a.value;
      break;
    case "lt":
      passed = actual < a.value;
      break;
    case "contains":
      passed = String(actual).includes(String(a.value));
      break;
    case "exists":
      passed = actual != null;
      break;
  }

  return {
    type: a.type,
    expected: a.value,
    actual,
    passed,
    message: passed
      ? `✅ ${a.type}${a.path ? "." + a.path : ""} ${a.operator} ${a.value}`
      : `❌ ${a.type}${a.path ? "." + a.path : ""}: expected ${a.operator} ${a.value}, got ${actual}`,
  };
}

// ===== Route =====
testsRouter.post("/run", async (req: Request, res: Response) => {
  const { tests, baseUrl } = req.body as {
    tests: TestCase[];
    baseUrl: string;
  };

  if (!tests || !Array.isArray(tests)) {
    res.status(400).json({ success: false, error: "tests array required" });
    return;
  }

  const results: any[] = [];

  for (const test of tests) {
    const start = Date.now();
    const result: any = {
      name: test.name,
      passed: true,
      assertions: [],
      time: 0,
      status: null,
      responseBody: null,
      error: null,
    };

    try {
      const fullUrl = test.url.startsWith("http")
        ? test.url
        : `${baseUrl}${test.url}`;

      const resp = await axios({
        method: test.method.toLowerCase() as any,
        url: fullUrl,
        headers: test.headers,
        data: test.body,
        timeout: 15000,
        validateStatus: () => true,
      });

      result.time = Date.now() - start;
      result.status = resp.status;
      result.responseBody = resp.data;

      // Run assertions
      if (Array.isArray(test.assertions)) {
        for (const a of test.assertions) {
          const ar = runAssertion(a, resp, result.time);
          result.assertions.push(ar);
          if (!ar.passed) result.passed = false;
        }
      }

      // Default status check
      if (test.expectedStatus != null) {
        const ok = resp.status === test.expectedStatus;
        result.assertions.push({
          type: "status",
          expected: test.expectedStatus,
          actual: resp.status,
          passed: ok,
          message: ok
            ? `✅ Status ${resp.status} matches`
            : `❌ Expected ${test.expectedStatus}, got ${resp.status}`,
        });
        if (!ok) result.passed = false;
      }
    } catch (err: any) {
      result.passed = false;
      result.error = err.message;
      result.time = Date.now() - start;
    }

    results.push(result);
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  res.json({
    success: true,
    summary: {
      total,
      passed,
      failed: total - passed,
      passRate: total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : "0%",
      totalTime: results.reduce((s, r) => s + r.time, 0),
    },
    results,
  });
});
