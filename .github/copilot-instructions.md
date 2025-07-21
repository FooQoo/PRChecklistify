# GitHub Copilot Instructions

This file provides guidelines for GitHub Copilot when working on the PR Checklistify Chrome extension project.

## Project Overview

PR Checklistify is a Chrome extension that streamlines pull request reviews by automatically generating checklists to prevent review oversights. Built with React, TypeScript, Vite, and organized as a Turborepo monorepo.

## Architecture

### Monorepo Structure
- **chrome-extension/**: Extension manifest and background scripts
- **pages/side-panel/**: Main React application (side panel UI)
- **packages/**: Shared libraries and utilities
- **tests/e2e/**: WebDriver-based E2E tests

### Main Application Structure (pages/side-panel/src/)
```
src/
├── atoms/               # Jotai state management atoms
├── components/          # Atomic Design structure
│   ├── atoms/          # Basic UI elements (Button, TextInput)
│   ├── molecules/      # Component combinations (ApiKeySettings)
│   ├── organisms/      # Complex components (FileChecklist, PRAnalysis)
│   └── templates/      # Page-level components
├── errors/              # Custom error classes
├── hooks/               # React state management hooks
├── repositories/        # Data access layer
│   ├── ai/             # AI service implementations (OpenAI, Gemini, Claude)
│   └── github/         # GitHub API client
├── services/            # Business logic services
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── views/               # Root components
```

### Technology Stack
- **React 19**: Functional components and hooks
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Jotai**: State management
- **React Router**: Memory router
- **Chrome Storage API**: Persistence
- **AI SDK**: OpenAI/Gemini/Claude integration

## Coding Guidelines

### Naming Conventions
- **Components**: PascalCase (e.g., `SidePanel`, `FileChatModal`)
- **Files**: PascalCase for components, camelCase for services/utilities
- **Atoms**: camelCase + "Atom" suffix (e.g., `currentPageAtom`)
- **Hooks**: "use" prefix (e.g., `usePRData`)
- **Routes**: kebab-case (e.g., `/github-token-setup`)
- **Functions/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Props Interfaces**: ComponentName + "Props"
- **CSS Classes**: Tailwind utility classes preferred

### Storage Key Naming
- **MUST use camelCase** for all storage keys (e.g., `modelClientType`, `openaiApiKey`)
- **NEVER use** kebab-case, snake_case, or PascalCase
- **Examples**:
  - ✅ `modelClientType`
  - ✅ `openaiApiEndpoint` 
  - ✅ `languagePreference`
  - ❌ `model-client-type`
  - ❌ `openai_api_endpoint`
  - ❌ `LanguagePreference`

### Component Design Patterns

#### React Component Template
```typescript
import type React from 'react';
import { useState } from 'react';

interface ComponentNameProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const ComponentName: React.FC<ComponentNameProps> = ({
  children,
  onClick,
  disabled = false,
  className = '',
}) => {
  // Implementation
  return <div>{children}</div>;
};

export default ComponentName;
```

#### Custom Hook Template
```typescript
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

export const dataAtom = atom<DataType | undefined>(undefined);

export function useDataAtom() {
  const [data, setData] = useAtom(dataAtom);
  
  useEffect(() => {
    // Initialization logic
  }, []);

  const updateData = async (newData: DataType) => {
    // Update logic
    setData(newData);
  };

  return {
    data,
    updateData,
  } as const;
}
```

#### Repository Class Template (Data Access Layer)
```typescript
import { storage } from '@extension/storage';
import type { DataType } from '@src/types';

export class DataRepository {
  /**
   * Simple CRUD operations only - no business logic
   */
  async saveData(key: string, data: DataType): Promise<void> {
    const allData = await storage.get();
    // Simple data operations only
    await storage.set(allData);
  }

  async getData(key: string): Promise<DataType | null> {
    // Simple data retrieval
    return null;
  }
}

export const dataRepository = new DataRepository();
```

#### Service Class Template (Business Logic Layer)
```typescript
import { dataRepository } from '@src/repositories/storage/dataRepository';

export class DataService {
  private readonly MAX_CACHE_SIZE = 20;
  
  private constructor() {}
  
  static create(): DataService {
    return new DataService();
  }
  
  /**
   * Business logic with cache management
   */
  async saveDataWithCacheManagement(key: string, data: DataType): Promise<void> {
    // Business logic implementation
    await dataRepository.saveData(key, data);
  }
}

export const dataService = DataService.create();
```

### Layer Responsibilities

#### Repositories (Data Access Layer)
- **Purpose**: Simple CRUD operations only
- **Responsibilities**: 
  - External API communication (GitHub API, AI APIs)
  - Storage read/write operations
  - **NO business logic**
- **Pattern**: Class-based with singleton export

#### Services (Business Logic Layer)
- **Purpose**: Application logic using repositories
- **Responsibilities**:
  - Cache size management, data consistency
  - Multiple repository coordination
  - Business rules and validations
- **Pattern**: Class-based with `static create()` and singleton export

### Import/Export Standards

#### Required Patterns
```typescript
// ✅ Required: Absolute paths with aliases
import type React from 'react';
import type { ComponentProps } from '@src/types';
import { useState } from 'react';
import { Button } from '@src/components/atoms/Button';
import { useI18n } from '@extension/i18n';

// ✅ Type imports with explicit type modifier
import type { Checklist } from '@src/types';

// ✅ Direct path imports (no index.ts files)
import { prDataRepository } from '@src/repositories/storage/prDataRepository';

// ❌ Avoid: Relative paths
import { ComponentProps } from '../../../types';

// ❌ Avoid: Index.ts imports
import { prDataRepository } from '@src/repositories/storage';
```

### TypeScript Guidelines

#### Type Definition Standards
```typescript
// Detailed type definitions
export interface PRData {
  id: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  files: PRFile[];
  description?: string; // Optional fields use ?
}

// Union types
export type ModelProvider = 'openai' | 'gemini' | 'claude';

// Generic types
export interface Storage<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
}
```

### State Management with Jotai
- Use Jotai atoms for global state
- Storage atoms automatically sync with Chrome Storage API
- Hook naming: `use[Noun]Atom` pattern (e.g., `useGithubTokenAtom`)
- Setters: `set[Noun]AndStorage`, Clearers: `clear[Noun]`

### AI Service Integration
- **Multiple providers**: OpenAI, Gemini, Claude
- **Architecture**: Repository layer (`repositories/ai/modelClient.ts`) integrates providers
- **Service layer**: `services/aiService.ts` provides singleton pattern
- **Usage**: Import and use `aiService` singleton for all AI operations

### Best Practices

#### Required Practices
- **Type Safety**: TypeScript strict mode, avoid `any` type
- **Single Responsibility**: One function/component = one purpose
- **Component Size**: Keep under 100 lines, prefer under 50
- **Pure Functions**: Prefer pure functions when possible
- **Error Handling**: Use custom error classes
- **Absolute Paths**: Always use `@src`, `@extension` aliases
- **Direct Imports**: No index.ts file imports

#### Forbidden Practices
```typescript
// ❌ Never use any type
const data: any = response;

// ❌ Never use relative paths
import { Component } from '../../../components';

// ❌ Never put business logic in repositories
export class BadRepository {
  async saveWithValidation(data: DataType) {
    if (!this.validateData(data)) throw new Error(); // ❌ Validation is Service layer responsibility
  }
}

// ❌ Never use kebab-case for storage keys
createStorage('user-profile-data', defaultValue);

// ❌ Never use function-based services
export const fetchData = async () => { /* */ };
```

#### Recommended Practices
```typescript
// ✅ Clear type definitions
const data: ResponseType = response;

// ✅ Single responsibility components
const FocusedComponent: React.FC<Props> = () => {
  // Single purpose implementation
};

// ✅ camelCase storage keys
createStorage('userProfileData', defaultValue);

// ✅ Class-based services
export class DataService {
  static create(): DataService {
    return new DataService();
  }
}
```

### Development Commands

```bash
# Development
pnpm dev              # Chrome development
pnpm dev:firefox      # Firefox development

# Build
pnpm build           # Chrome build
pnpm build:firefox   # Firefox build

# Code Quality
pnpm type-check      # Type checking
pnpm lint           # Linting
pnpm lint:fix       # Auto-fix linting
pnpm prettier       # Code formatting

# Testing
pnpm e2e            # E2E tests
```

### Security Guidelines
- API keys stored securely in Chrome Storage API
- No sensitive data in source code
- Follow CSP (Content Security Policy)
- Validate external API communications
- No sensitive data in logs

### Internationalization (i18n)
- Use `useI18n` hook for multi-language support
- Translation keys use dot notation (e.g., `user.profile.name`)
- **Important**: When implementing new UI components, always implement i18n support simultaneously for all displayed text

### Performance Considerations
- Use React.memo for expensive components
- Implement useCallback for handlers with dependencies
- Conditional rendering: `{isVisible && <Component />}`
- Proper key attributes in lists: `key={item.id}`

---

*Follow these guidelines to maintain code quality, consistency, and project architecture standards.*