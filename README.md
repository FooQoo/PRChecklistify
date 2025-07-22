# PR Checklistify

PR Checklistifyは、Pull Requestのレビューを効率化するためのChrome拡張機能です。
AIを活用してPRの内容を自動解析し、確認すべき項目をチェックリストとして自動生成し、レビュープロセスの抜け漏れを防ぎます。

## Key Features

- **AI-Powered Analysis**: OpenAI、Gemini、Claude等のAIプロバイダーを使用してPRを自動解析
- **Smart Checklist Generation**: AIがPRの内容に基づいて適切なチェックリストを自動生成
- **Interactive Chat**: ファイル別のAIチャット機能でコードについて質問可能
- **Multi-Provider Support**: 複数のAI APIプロバイダーに対応
- **Modern Tech Stack**: React 19 + TypeScript + Vite + Tailwind CSS
- **Monorepo Architecture**: Turborepoによる効率的なモノレポ構成

---

## About This Project

このプロジェクトは**FooQoo**によって開発された個人プロジェクトです。特定の企業や団体とは一切関係がありません。

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [License](#license)
- [Credits](#credits)

## Features

### AI-Powered PR Analysis
- **Automatic Code Analysis**: AI models analyze PR content and generate relevant checklists
- **Multi-Provider Support**: Works with OpenAI, Google Gemini, and Anthropic Claude
- **Smart Suggestions**: Context-aware checklist items based on code changes

### Interactive Review Experience
- **File-Level Chat**: Ask AI questions about specific files in the PR
- **Progress Tracking**: Visual progress indicators for review completion
- **Copy-Paste Ready**: Easy-to-use buttons for copying checklist items

### Modern Development Stack
- **React 19**: Latest React features with concurrent rendering
- **TypeScript**: Full type safety throughout the codebase
- **Jotai**: Atomic state management with Chrome Storage sync
- **Tailwind CSS**: Utility-first styling with consistent design system

## Installation

### Prerequisites
- Node.js 22.12.0 or higher
- pnpm package manager

### Setup Steps

1. Clone this repository:
```bash
git clone <repository-url>
cd PRChecklistify
```

2. Install dependencies:
```bash
pnpm install
```

3. Build and install the extension:
```bash
# For Chrome
pnpm dev

# For Firefox
pnpm dev:firefox
```

4. Load the extension in your browser:
   - **Chrome**: Go to `chrome://extensions` → Enable Developer mode → Load unpacked → Select `dist` directory
   - **Firefox**: Go to `about:debugging` → This Firefox → Load Temporary Add-on → Select manifest file

## Usage

### Getting Started
1. Navigate to any GitHub Pull Request page
2. Open the Chrome side panel (extension icon in toolbar)
3. Configure your AI API key in the settings
4. Click "Analyze PR" to generate an AI-powered checklist

### AI Features
- **PR Analysis**: Get comprehensive analysis of code changes
- **Custom Checklists**: Generate context-specific review checklists
- **File Chat**: Ask questions about specific files using AI
- **Multiple Providers**: Switch between OpenAI, Gemini, and Claude

## Development

### Development Environment
This project uses a modern monorepo setup with Turborepo for efficient development and build processes.

### Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite with optimized Chrome extension configuration
- **State Management**: Jotai with Chrome Storage API integration
- **AI Integration**: ai-sdk library with multiple provider support
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: WebDriver-based E2E tests

## Configuration

### OpenAI API Compatibility
The extension supports OpenAI-compatible endpoints, allowing integration with:
- Azure OpenAI Service
- Custom OpenAI-compatible deployments
- Local AI model servers

## Scripts

### Development Commands
```bash
# Install dependencies
pnpm install

# Development mode (Chrome)
pnpm dev

# Development mode (Firefox)
pnpm dev:firefox
```

### Build Commands
```bash
# Production build (Chrome)
pnpm build

# Production build (Firefox)  
pnpm build:firefox

# Create distribution zip
pnpm zip

# Create Firefox distribution zip
pnpm zip:firefox
```

### Code Quality
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Lint with automatic fixes
pnpm lint:fix

# Code formatting
pnpm prettier
```

### Testing
```bash
# Run E2E tests (Chrome)
pnpm e2e

# Run E2E tests (Firefox)
pnpm e2e:firefox
```

### Maintenance Commands
```bash
# Clean build artifacts
pnpm clean:bundle

# Clean node_modules
pnpm clean:node_modules

# Clean Turbo cache
pnpm clean:turbo

# Complete cleanup
pnpm clean
```

## Architecture

### Monorepo Structure
```
PRChecklistify/
├── chrome-extension/          # Extension manifest and background scripts
├── pages/
│   └── side-panel/           # Main React application
├── packages/
│   ├── shared/               # Shared utilities and components
│   ├── storage/              # Chrome Storage API abstractions
│   └── i18n/                 # Internationalization support
└── tests/
    └── e2e/                  # End-to-end tests
```

### Side Panel Application Structure
```
pages/side-panel/src/
├── atoms/                    # Jotai state atoms
├── components/               # Atomic Design components
│   ├── atoms/               # Basic UI elements
│   ├── molecules/           # Component combinations
│   ├── organisms/           # Complex components
│   └── templates/           # Page layouts
├── hooks/                   # Custom React hooks
├── repositories/            # Data access layer
│   ├── ai/                  # AI service clients
│   └── github/              # GitHub API client
├── services/                # Business logic services
├── types/                   # TypeScript definitions
├── utils/                   # Utility functions
└── views/                   # Route components
```

### Key Design Patterns
- **Atomic Design**: Component organization following atoms → molecules → organisms → templates
- **Repository Pattern**: Separation of data access from business logic
- **Service Layer**: Centralized business logic with singleton patterns
- **State Management**: Jotai atoms with Chrome Storage synchronization

## License

MIT License - see the LICENSE file for details.

## Credits

This project is built upon the following template:

- [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)

### Key Dependencies
- **AI SDK**: For unified AI provider integration
- **Jotai**: Atomic state management
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Turbo**: Monorepo build system
- **Vite**: Fast build tool and dev server

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the established coding standards in `CLAUDE.md`
- Use TypeScript strict mode
- Follow Atomic Design principles for components
- Ensure all new features include appropriate tests
- Maintain consistent naming conventions (camelCase for storage keys)

## Support

For questions, bug reports, or feature requests, please open an issue on GitHub.
