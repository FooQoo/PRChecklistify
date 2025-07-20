// Common interface for LLM clients (OpenAI, Gemini, etc.)
import type { Checklist, PRData, PRFile } from '@src/types';
import { createOpenAIClient } from './openai';
import { createGeminiClient } from './gemini';
import { createClaudeClient } from './claude';
import { getLLMProviderById } from './configLoader';
import { modelClientTypeStorage, ModelClientType, type Language, getLanguageLabel } from '@extension/storage';
import { APICallError } from 'ai';
import { z } from 'zod';
import { LLMError } from '@src/errors/LLMError';

// Re-export ModelClientType for backward compatibility
export { ModelClientType } from '@extension/storage';

// Error handling for LLM services with i18n support
export function handleLLMError(error: unknown): never {
  if (APICallError.isInstance(error) && error.message.includes('API key not valid')) {
    throw LLMError.createAPIKeyError(error);
  }

  throw LLMError.createServiceError(error);
}

// 共通のシステムプロンプト
export const SYSTEM_PROMPT =
  'You are a senior software developer conducting a thorough code review. You provide detailed, actionable feedback in JSON format as requested.';

// チェックリストアイテム
export const ChecklistItemSchema = z
  .object({
    id: z.string().describe('チェックリストアイテムの一意なID'),
    description: z.string().describe('チェックリストアイテムの説明文'),
    isChecked: z.boolean().describe('レビューが完了したかどうか'),
  })
  .describe('チェックリストアイテム（ID・説明・チェック状態）');

// ファイル単位のチェックリスト（説明＋アイテム配列）
export const ChecklistSchema = z
  .object({
    filename: z.string().describe('対象ファイル名'),
    explanation: z.string().describe('ファイル全体に対する説明'),
    checklistItems: z.array(ChecklistItemSchema).describe('このファイルに対するチェックリストアイテムの配列'),
  })
  .describe('ファイル単位のチェックリスト（説明＋アイテム配列）');

// ModelClientType for selecting the appropriate LLM service

// Common interface for all LLM clients
export interface ModelClient {
  analyzePR(prData: PRData, file: PRFile, languageOverride?: string): Promise<Checklist>;
  streamChatCompletion(
    messages: { role: 'user' | 'system' | 'assistant'; content: string }[],
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
  ): Promise<void>;
}

// Factory function to create appropriate client
export async function createModelClient(): Promise<ModelClient> {
  // Get the preferred client type from storage, default to OpenAI if not set
  const clientType = (await modelClientTypeStorage.get()) || ModelClientType.OpenAI;

  // Get provider configuration from JSON
  const providerConfig = getLLMProviderById(clientType);

  switch (clientType) {
    case ModelClientType.OpenAI:
      return await createOpenAIClient(providerConfig.apiEndpoint);
    case ModelClientType.Gemini:
      return await createGeminiClient(providerConfig.apiEndpoint);
    case ModelClientType.Claude:
      return await createClaudeClient(providerConfig.apiEndpoint);
  }
}

// Build the prompt for PR analysis (moved from OpenAIClient)
export function buildPRAnalysisPrompt(prData: PRData, file: PRFile, language: Language): string {
  const { title, body } = prData;

  // return `\nAnalyze this pull request and provide your response in Japanese. Include:\nDo not omit or summarize any file. Include all changed files in the output.\n\n1. (Must Require) A summary of the PR, including:\n   * Background\n   * Problem being solved\n   * Solution approach\n   * Implementation details\n\n2. (Must Require) For each changed file, create an explanation of the changes, focusing on:\n   * Why the changes were made\n   * How they relate to the overall PR\n   * Any specific areas of concern or interest\n   * Any additional context that would help in the review\n\n3. (Optional) For each changed file, create a checklist of specific items to review, focusing on:\n   * Background and problem being solved\n   * Code correctness\n   * Best practices\n   * Potential bugs\n   * Performance concerns\n   * Security implications\n   * Code is well-formatted and consistent with project style\n\n### Additional instructions for file analysis:\n\n* **All changed files must be included** in the fileAnalysis output. Do not omit any file.\n* For **core logic files, UI components, specifications, and tests**, generate detailed checklist items with:\n  * description: e.g. "Check that..." \n  * status: "PENDING".\n* For **mock data files, slice files, and type definition files**, generate only one checklist item with:\n\n  * description: e.g. "Low risk - review not required."\n  * status: "OK"\n* For **dist and other build artifacts**, generate only one checklist item with:\n\n  * description: e.g. "Build artifact - review not required."\n  * status: "OK"\n* Provide a meaningful explanation for every file, even for mocks and dist files, summarizing why they changed and their role in the PR.\n\nPR Title: ${title}\nPR Description: ${body}\n\nChanged Files:\n${fileChanges}\n\nFormat your response as a JSON object with the following structure:\n{\n  "summary": "summary of the PR in ${languageLabel}",\n  "fileAnalysis": [\n    {\n      "id": "file-1",\n      "filename": "path/to/file.ts",\n      "explanation": "Update the checklist for this file generated by OpenAI",\n      "checklistItems": [\n        {\n          "id": "item_0",\n          "description": "Check that...",\n          "status": "PENDING"\n        },\n        ...more items\n      ],\n      "order": 1 // review order\n    },\n    ...more files\n  ]\n}\n\nImportant: All text content and checklist inside the JSON must be in ${languageLabel}. Keep the JSON structure and field names in English.\n`;
  // コメント情報をプロンプト用に整形
  const commentsText =
    prData.userComments && prData.userComments.length > 0
      ? `\n\nReview Comments (for reviewer context):\n` +
        prData.userComments.map(c => `- [${c.user.login} at ${c.created_at}]: ${c.body.replace(/\n/g, ' ')}`).join('\n')
      : '';

  return `
File: ${file.filename} (${file.status})
Changes: +${file.additions} -${file.deletions}
${file.patch ? `Patch:\n${file.patch}` : 'No patch available'}

Analyze this pull request file and provide your response in ${getLanguageLabel(language)}.

You are a code review assistant.
For each changed file in a pull request, generate a checklist of specific review items.

Checklist items must:
- Be concise and focused on meaningful implementation details such as logic, edge cases, maintainability, or structural impact.
- Avoid vague or superficial items like “Please ensure the function works correctly” or “Please check naming.”

Organize the checklist into two sections:

For each changed file, create a checklist of specific items to review, focusing on:

Must:
* Background and problem being solved
* Code correctness
* Best practices
* Potential bugs
* Performance concerns
* Security vulnerabilities.
* Code is well-formatted and consistent with project style
* Verify that naming is clear and will not hinder future maintenance.

Want:
* Look for minor formatting issues such as indentation or spacing.
* Confirm the implementation style is consistent with existing code.
* Review comments or documentation for potential improvements.
* Check that no non-essential features are included at this stage.

**Do not generate checklist items unless there is a specific, meaningful point to review.**  
Do not include items that merely state obvious or general expectations.  
Only include items if there is a concrete reason to review that part of the code.

If no valid checklist items are found, create exactly one checklist item with:
* description: "No issues found"
* isChecked: true

### Additional instructions for file analysis:

* Max checklist items per file: 3

* For **core logic files, UI components, specifications, and tests**, generate detailed checklist items with:
  * description: e.g. "Check that..."
  * isChecked: false
* For **mock data files, slice files, and type definition files**, generate only one checklist item with:
  * description: e.g. "Low risk - review not required."
  * isChecked: true
* For **dist and other build artifacts**, generate only one checklist item with:
  * description: e.g. "Build artifact - review not required."
  * isChecked: true
* For **files with no specific issues to review**, generate only one checklist item with:
  * description: "No issues found"
  * isChecked: true
* Provide a meaningful explanation for every file, even for mocks and dist files, summarizing why they changed and their role in the PR.

  PR Title: ${title}
  PR Description: ${body}
PR Comments: ${commentsText || 'No comments provided.'}
Repository README: ${prData.readme || 'No README provided.'}
Repository information: ${prData.instructions || 'No instructions provided.'}

Format your response as a JSON object with the following structure:
{
  "filename": "path/to/file.ts",
  "explanation": "Update the checklist for this file generated by OpenAI",
  "checklistItems": [
    {
      "id": "item_0",
      "description": "Check that...",
      "isChecked": false
    },
    ...more items
  ]
}

Important: All text content and checklist inside the JSON must be in ${getLanguageLabel(language)}. Keep the JSON structure and field names in English.
`;
}
