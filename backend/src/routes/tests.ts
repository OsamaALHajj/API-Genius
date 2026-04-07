import { Router } from 'express';
import axios from 'axios';

export const testsRouter = Router();

// ===== Types =====
interface TestAssertion {
  type: 'status' | 'body' | 'header' | 'time';
  path?: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'exists';
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

interface AssertionResult {
  type: string;
  expected: any;
  actual: any;
  passed: boolean;
  message: string;
}

// ===== Helper: standalone function (NOT `this.`) =====
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
}

function runAssertion(
  assertion: TestAssertion,
  response: { status: number; headers: any; data: any },
  responseTime: number
): AssertionResult {
  let actual: any;
  let expected = assertion.value;

  switch (assertion.type) {
    case 'status':
      actual = response.status;
      break;
    case 'body':
      actual = assertion.path ? getNestedValue(response.data, assertion.path) : response.data;
      break;
    case 'header':
      actual = assertion.path ? response.headers[assertion.path.toLowerCase()] : response.headers;
      break;
    case 'time':
      actual = responseTime;
      break;
    default:
      actual = undefined;
  }

  let passed = false;
  switch (assertion.operator) {
    case 'eq':
      passed = actual === expected;
      break;
    case 'ne':
      passed = actual !== expected;
      break;
    case 'gt':
      passed = actual > expected;
      break;
    case 'lt':
      passed = actual < expected;
      break;
    case 'contains':
      passed = typeof actual === 'string'
        ? actual.includes(expected)
        : Array.isArray(actual) ? actual.includes(expected) : false;
      break;
    case 'exists':
      passed = actual !== undefined && actual !== null;
      break;
  }

  return {
    type: assertion.type,
    expected,
    actual,
    passed,
    message: passed
      ? `✅ ${assertion.type}${assertion.path ? '.' + assertion.path : ''} ${assertion.operator} ${expected}`
      : `❌ ${assertion.type}${assertion.path ? '.' + assertion.path : ''}: expected ${assertion.operator} ${expected}, got ${actual}`
  };
}

// ===== Route =====
testsRouter.post('/run', async (req, res) => {
  const { tests, baseUrl }: { tests: TestCase[]; baseUrl: string } = req.body;

  if (!tests || !Array.isArray(tests)) {
    res.status(400).json({ success: false, error: 'tests array is required' });
    return;
  }

  const results: any[] = [];

  for (const test of tests) {
    const startTime = Date.now();
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
      const fullUrl = test.url.startsWith('http')
        ? test.url
        : `${baseUrl}${test.url}`;

      const response = await axios({
        method: test.method.toLowerCase() as any,
        url: fullUrl,
        headers: test.headers,
        data: test.body,
        timeout: 15000,
        validateStatus: () => true,
      });

      result.time = Date.now() - startTime;
      result.status = response.status;

      // Truncate large response bodies
      try {
        const bodyStr = JSON.stringify(response.data);
        result.responseBody = bodyStr.length > 5000
          ? JSON.parse(bodyStr.substring(0, 5000) + '..."')
          : response.data;
      } catch {
        result.responseBody = response.data;
      }

      // Run custom assertions
      if (test.assertions && Array.isArray(test.assertions)) {
        for (const assertion of test.assertions) {
          const assertResult = runAssertion(assertion, response, result.time);
          result.assertions.push(assertResult);
          if (!assertResult.passed) result.passed = false;
        }
      }

      // Default status assertion
      if (test.expectedStatus) {
        const statusPassed = response.status === test.expectedStatus;
        result.assertions.push({
          type: 'status',
          expected: test.expectedStatus,
          actual: response.status,
          passed: statusPassed,
          message: statusPassed
            ? `✅ Status ${response.status} matches expected`
            : `❌ Expected status ${test.expectedStatus}, got ${response.status}`
        });
        if (!statusPassed) result.passed = false;
      }
    } catch (error: any) {
      result.passed = false;
      result.error = error.message;
      result.time = Date.now() - startTime;
    }

    results.push(result);
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  res.json({
    success: true,
    summary: {
      total,
      passed,
      failed: total - passed,
      passRate: total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0%',
      totalTime: results.reduce((sum, r) => sum + r.time, 0),
    },
    results,
  });
});
