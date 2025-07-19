# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

PR Checklistify is a Chrome extension that streamlines Pull Request reviews by automatically generating checklists. It's built with React + TypeScript + Vite in a monorepo structure using Turborepo.

## Development Commands

### Environment Setup
```bash
# Install dependencies
pnpm install

# Create required .env file for side-panel
echo 'VITE_OPENAI_API_ENDPOINT=https://api.openai.com/v1' > pages/side-panel/.env
echo 'VITE_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/openai/' >> pages/side-panel/.env
echo 'VITE_GITHUB_API_DOMAIN=https://api.github.com' >> pages/side-panel/.env
```

### Build & Development
```bash
# Development (Chrome)
pnpm dev

# Development (Firefox)
pnpm dev:firefox

# Build (Chrome)
pnpm build

# Build (Firefox)
pnpm build:firefox

# Build production zip
pnpm zip
```

### Code Quality
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Lint with fixes
pnpm lint:fix

# Format code
pnpm prettier
```

### Testing
```bash
# Run E2E tests
pnpm e2e

# Run E2E tests for Firefox
pnpm e2e:firefox
```

### Clean Commands
```bash
# Clean build files
pnpm clean:bundle

# Clean node_modules
pnpm clean:node_modules

# Clean turbo cache
pnpm clean:turbo

# Clean all
pnpm clean
```

## Architecture

### Monorepo Structure
- **chrome-extension/**: Extension manifest and background scripts
- **pages/side-panel/**: Main React application (side panel UI)
- **packages/**: Shared libraries and utilities
- **tests/e2e/**: End-to-end tests using WebDriver

### Main Application (pages/side-panel/src/)
```
src/
├── components/           # Atomic Design structure
│   ├── atoms/           # Basic UI elements (Button, TextInput, etc.)
│   ├── molecules/       # Component combinations (ApiKeySettings, etc.)
│   ├── organisms/       # Complex components (FileChecklist, PRAnalysis, etc.)
│   └── templates/       # Page-level components
├── services/            # AI service integrations (OpenAI, Gemini, Claude)
├── hooks/               # Custom React hooks for state management
├── views/               # Route components
├── routes/              # React Router configuration
├── context/             # React Context providers
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Key Technologies
- **React 19** with functional components and hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Jotai** for state management
- **React Router** with memory router
- **Chrome Storage API** for persistence
- **AI SDK** for OpenAI/Gemini/Claude integrations

### State Management
- Uses Jotai atoms for global state
- Storage atoms automatically sync with Chrome Storage API
- Hooks follow pattern: `use[Noun]Atom` (e.g., `useGithubTokenAtom`)
- Setters: `set[Noun]AndStorage`, Clearers: `clear[Noun]`

## Naming Conventions

### Components & Files
- **Components**: PascalCase (e.g., `SidePanel`, `FileChatModal`)
- **Files**: PascalCase for components, camelCase for services/utils
- **Atoms**: camelCase + "Atom" suffix (e.g., `currentPageAtom`)
- **Hooks**: "use" prefix (e.g., `usePRData`)
- **Routes**: lowercase with hyphens (e.g., `/github-token-setup`)

### Code Style
- **Functions/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Props Interfaces**: ComponentName + "Props"
- **CSS Classes**: Tailwind utility classes preferred

## AI Service Integration

The extension integrates with multiple AI providers:
- **OpenAI**: GPT models via OpenAI API
- **Gemini**: Google's AI models
- **Claude**: Anthropic's models

Services are abstracted through a unified `modelClient` interface in `services/modelClient.ts`.

## Chrome Extension Architecture

### Background Script
- Handles extension icon clicks to open side panel
- Monitors tab changes and updates current page URL in storage
- Located in `chrome-extension/src/background/index.ts`

### Side Panel
- Main React application rendered in Chrome's side panel
- Communicates with background script via Chrome Storage API
- Handles PR analysis and checklist generation

## Development Notes

### Environment Variables
- API endpoints configurable via `.env` files
- OpenAI API compatibility for custom endpoints
- GitHub API domain configurable for enterprise instances

### Storage
- All sensitive data (API keys) stored securely via Chrome Storage API
- Never hardcode API keys in source code
- Use provided storage hooks for persistence

#### Storage Key Naming Convention
- **ALWAYS use camelCase** for all storage keys (e.g., `modelClientType`, `openaiApiKey`)
- Never use kebab-case, snake_case, or PascalCase for storage keys
- Examples of correct naming:
  - ✅ `modelClientType`
  - ✅ `openaiApiEndpoint`
  - ✅ `languagePreference`
  - ❌ `model-client-type`
  - ❌ `openai_api_endpoint`
  - ❌ `LanguagePreference`
- Storage implementations in `packages/storage/lib/impl/` should use `createStorage()` with camelCase keys
- When adding new storage, ensure the key follows this convention to maintain consistency

### Error Handling
- Components wrapped with error boundaries
- Suspense for loading states
- Graceful error handling throughout the application

### Testing
- E2E tests use WebDriver for browser automation
- Tests run against built extension in both Chrome and Firefox
- Test configuration in `tests/e2e/config/`