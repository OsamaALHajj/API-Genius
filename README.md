<div align="center">

# ⚡ API Genius

### AI-Powered API Testing Tool

Automatically generate test data, code examples, documentation, and security tests
from any OpenAPI/Swagger spec — works **with or without** AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**[Features](#-features) • [Quick Start](#-quick-start) • [AI Providers](#-ai-providers) • [Usage Guide](#-usage-guide) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)**

</div>

---

## 🎯 Why API Genius?

Testing APIs shouldn't be tedious. Traditional tools require you to manually write
test data, create code snippets, and build documentation from scratch.

**API Genius changes that.**

Simply paste any OpenAPI/Swagger spec URL and within seconds you'll have:

- 🧪 **Intelligent test data** — happy paths, edge cases, and security scenarios
- 💻 **Code examples** in 12+ programming languages
- 📝 **Complete API documentation** — auto-generated Markdown
- 🔒 **Security vulnerability detection** — SQL injection, XSS, auth bypass
- ⚡ **Performance insights** — response time tracking and analysis

### 🆓 Works Without Any API Key!

API Genius includes a **smart local generator** that produces test data, code
examples, documentation, and tests **without any AI service**. Add a free
Gemini or Groq key to unlock AI-powered generation.

| Mode | Cost | Quality | Setup |
|------|------|---------|-------|
| ⚪ **Local** (No AI) | Free forever | Good | Zero config |
| 🟢 **Google Gemini** | Free tier | Excellent | 1 minute |
| 🟢 **Groq** | Free tier | Excellent | 1 minute |
| 🟡 **OpenAI** | Paid | Excellent | Requires billing |

---

## ✨ Features

### 📡 Smart Endpoint Discovery

Automatically parses all endpoints from any OpenAPI 2.0 / 3.0 or Swagger spec.
Just paste a URL — API Genius discovers endpoints, parameters, request bodies,
response schemas, and authentication requirements.

### 🧪 AI-Generated Test Data

Generates contextually relevant test data for every endpoint:

| Category | Description |
|----------|-------------|
| **Happy Path** | Valid requests that should succeed |
| **Edge Cases** | Boundary values, empty fields, special characters |
| **Error Cases** | Invalid data to test error handling |
| **Security Tests** | SQL injection, XSS, authentication bypass attempts |
| **Boundary Values** | Min/max integers, long strings, negative numbers |

### 💻 Code Examples in 12 Languages

Instantly generate production-ready code snippets:

| | | | |
|---|---|---|---|
| JavaScript (Fetch) | Python (Requests) | Java (HttpClient) | C# (HttpClient) |
| JavaScript (Axios) | Go (net/http) | Ruby (Net::HTTP) | PHP (Guzzle) |
| cURL | Swift (URLSession) | Kotlin (OkHttp) | Dart (http) |

### 📝 Documentation Generation

Produce clean, comprehensive API documentation automatically — with parameter
tables, response schemas, example payloads, and authentication details.
Export as Markdown or copy to clipboard.

### 🔒 Security Testing

AI-powered security analysis that identifies potential vulnerabilities including
injection attacks, broken authentication, and data exposure risks.

### ⚡ Response Analysis

Real-time response inspection with status codes, headers, body parsing,
response time tracking, and size calculation.

### 🧪 Test Runner

Run automated tests directly from the browser. Quick tests check endpoint
availability, response time, and error handling. Generate full Jest, Mocha,
and pytest test suites.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org/)
- **AI Key (Optional)** — Works without one! See [AI Providers](#-ai-providers)


<div align="center">

# 📊 Project Statistics

<table>
  <tr>
    <td align="center">
      <img src="https://img.shields.io/github/downloads/USERNAME/REPO/total?style=for-the-badge&color=brightgreen&logo=github&logoColor=white" />
      <br><b>📥 Total Downloads</b>
    </td>
    <td align="center">
      <img src="https://komarev.com/ghpvc/?username=USERNAME&style=for-the-badge&color=blueviolet" />
      <br><b>👁️ Profile Views</b>
    </td>
    <td align="center">
      <img src="https://img.shields.io/github/stars/USERNAME/REPO?style=for-the-badge&color=yellow&logo=github&logoColor=white" />
      <br><b>⭐ Stars</b>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://img.shields.io/github/forks/USERNAME/REPO?style=for-the-badge&color=blue&logo=github&logoColor=white" />
      <br><b>🍴 Forks</b>
    </td>
    <td align="center">
      <img src="https://img.shields.io/github/issues/USERNAME/REPO?style=for-the-badge&color=red&logo=github&logoColor=white" />
      <br><b>🐛 Open Issues</b>
    </td>
    <td align="center">
      <img src="https://img.shields.io/github/last-commit/USERNAME/REPO?style=for-the-badge&color=orange&logo=git&logoColor=white" />
      <br><b>🕒 Last Commit</b>
    </td>
  </tr>
</table>

</div>


### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/api-genius.git
cd api-genius
