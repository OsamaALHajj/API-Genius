<div align="center">

# ⚡ API Genius

### AI-Powered API Testing Tool

**Automatically generate test data, code examples, documentation, and security tests from any OpenAPI/Swagger spec — powered by GPT-4o.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai&logoColor=white)](https://openai.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[Demo](#-demo) • [Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

---

<img src="docs/screenshots/hero-demo.gif" alt="API Genius Demo" width="800"/>

</div>

## 🎯 Why API Genius?

Testing APIs shouldn't be tedious. Traditional tools require you to manually write test data, create code snippets, and build documentation from scratch. **API Genius** changes that by leveraging AI to do the heavy lifting.

Simply point it at any OpenAPI/Swagger specification URL, and within seconds you'll have:

- Intelligent test data covering happy paths, edge cases, and security scenarios
- Ready-to-use code examples in **14 programming languages**
- Complete, well-structured API documentation
- Automated security vulnerability detection
- Performance insights and response analysis

---

## ✨ Features

### 📡 Smart Endpoint Discovery
Automatically parses and discovers all endpoints from any OpenAPI 2.0/3.0/3.1 or Swagger specification. Just paste a URL and let API Genius do the rest.

### 🧪 AI-Generated Test Data
GPT-4o generates contextually relevant test data for every endpoint, including:
- **Happy path** — Valid requests that should succeed
- **Edge cases** — Boundary values, empty fields, special characters
- **Security tests** — SQL injection, XSS, authentication bypass attempts

### 💻 Code Examples in 14 Languages
Instantly generate production-ready code snippets in:

| | | | |
|---|---|---|---|
| JavaScript (Fetch) | Python (Requests) | Java (HttpClient) | C# (HttpClient) |
| TypeScript (Axios) | Go (net/http) | Ruby (Net::HTTP) | PHP (cURL) |
| Rust (reqwest) | Swift (URLSession) | Kotlin (OkHttp) | Dart (http) |
| cURL | PowerShell | | |

### 📝 Documentation Generation
Produce clean, comprehensive API documentation automatically — complete with parameter descriptions, response schemas, example payloads, and authentication details.

### 🔒 Security Testing
AI-powered security analysis that proactively identifies potential vulnerabilities, including injection attacks, broken authentication, and data exposure risks.

### ⚡ Response Analysis
Real-time response inspection with status codes, headers, body parsing, response time tracking, and performance recommendations.

---

## 📸 Demo

<div align="center">

| Endpoint Discovery | AI Test Generation | Code Examples |
|:---:|:---:|:---:|
| <img src="docs/screenshots/endpoints.png" width="280"/> | <img src="docs/screenshots/test-gen.png" width="280"/> | <img src="docs/screenshots/code-examples.png" width="280"/> |

</div>

> 💡 **Live Demo**: [Coming Soon](#) — Star the repo to get notified!

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher — [Download](https://nodejs.org/)
- **OpenAI API Key** — [Get one here](https://platform.openai.com/api-keys)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/api-genius.git
cd api-genius
