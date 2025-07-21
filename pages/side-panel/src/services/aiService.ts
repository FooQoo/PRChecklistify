import type { PRData, PRFile, Language } from '@extension/shared';
import type { ModelClient } from '../repositories/ai/modelClient';
import { getLanguageLabel } from '@extension/storage';
import { LLMError } from '@src/errors/LLMError';

export interface StreamOptions {
  signal?: AbortSignal;
}

export interface ChatMessage {
  sender: string;
  message: string;
}

export class AIService {
  constructor(private readonly modelClientFactory: () => Promise<ModelClient>) {}

  private validatePRData(prData: PRData): void {
    if (!prData || !prData.files || !Array.isArray(prData.files)) {
      throw new LLMError('invalidPRData');
    }
  }

  private async getModelClient() {
    const client = await this.modelClientFactory();
    if (!client) {
      throw LLMError.createServiceError();
    }
    return client;
  }

  private handleError(error: unknown): never {
    if (LLMError.isLLMError(error)) {
      throw error;
    }
    throw LLMError.createServiceError(error);
  }

  /**
   * Generate AI analysis for a PR file
   */
  async generateAnalysis(prData: PRData, file: PRFile, language: Language) {
    try {
      this.validatePRData(prData);

      const client = await this.getModelClient();
      const analysisResult = await client.analyzePR(prData, file, language);

      return analysisResult;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generate checklist for a PR file
   */
  async generateChecklist(prData: PRData, file: PRFile, language: Language) {
    try {
      if (!prData || !file) {
        throw new LLMError('invalidPRData');
      }

      const client = await this.getModelClient();
      return await client.analyzePR(prData, file, language);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Stream chat completion for file chat
   */
  async streamFileChat(
    prData: PRData,
    file: PRFile,
    chatHistory: ChatMessage[],
    onToken: (token: string) => void,
    language: Language,
    options?: StreamOptions,
    allDiffs?: Record<string, string>,
  ): Promise<void> {
    try {
      this.validatePRData(prData);

      // Build context information
      const prInfo = `title: ${prData.title || ''}\ndescription: ${prData.body || ''}\nauthor: ${prData.user?.login || ''}`;
      const fileInfo = `\nfilename: ${file.filename}\ndiff:\n${file.patch || ''}\nfull code:\n${file.decodedContent || ''}`;
      const instructionsSection = `\n--- Repository Information ---\n${prData.instructions || ''}`;
      const readme = `\n--- README Content ---\n${prData.readme || ''}`;

      // Format review comments
      let commentsText = '';
      if (prData.userComments && prData.userComments.length > 0) {
        commentsText =
          '\n--- Review Comments (for reviewer context) ---\n' +
          prData.userComments
            .map(c => `- [${c.user.login} at ${c.created_at}]: ${c.body.replace(/\n/g, ' ')} (file: ${c.path})`)
            .join('\n');
      }

      // Format all diffs if provided
      let allDiffsInfo = '';
      if (allDiffs) {
        allDiffsInfo =
          '\n--- all diff ---\n' +
          Object.entries(allDiffs)
            .map(([fname, diff]) => `【${fname}】\n${diff}`)
            .join('\n\n');
      }

      // Build messages
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        {
          role: 'system',
          content: `You are a senior software developer conducting a thorough code review in ${getLanguageLabel(language)}. You provide detailed, actionable feedback as an AI reviewer.\n${prInfo}${fileInfo}${allDiffsInfo}${instructionsSection}${readme}${commentsText}`,
        },
        ...chatHistory.map((msg): { role: 'user' | 'assistant'; content: string } => ({
          role: msg.sender === 'You' ? 'user' : 'assistant',
          content: msg.message,
        })),
      ];

      const client = await this.getModelClient();
      await client.streamChatCompletion(messages, onToken, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Stream PR summary generation
   */
  async streamPRSummary(
    prData: PRData,
    language: Language,
    onToken: (token: string) => void,
    options?: StreamOptions,
  ): Promise<void> {
    try {
      this.validatePRData(prData);

      const client = await this.getModelClient();
      const diff = prData.files.map(file => file.patch || '').join('\n\n');

      // Format review comments
      let commentsText = '';
      if (prData.userComments && prData.userComments.length > 0) {
        commentsText =
          '\n--- Review Comments (for reviewer context) ---\n' +
          prData.userComments
            .map(c => `- [${c.user.login} at ${c.created_at}]: ${c.body.replace(/\n/g, ' ')}`)
            .join('\n');
      }

      const mergeStatus = prData.merged_at ? 'merged' : prData.closed_at ? 'closed' : 'open';

      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        {
          role: 'system',
          content: `This is a pull request summary generation task. You will generate a concise summary of the pull request content in ${getLanguageLabel(language)}.\n\nPR Author: ${prData.user?.login || 'Unknown'}\nPR Title: ${prData.title}\nPR Description: ${prData.body}\nPR diff: ${diff}\nRepository README: ${prData.readme || ''}\nRepository information: ${prData.instructions || ''}\nPR Merge Status: ${mergeStatus}${commentsText}`,
        },
        {
          role: 'user',
          content: `Summarize the content of this pull request concisely from the following five perspectives: Background & Problem, Solution & Implementation, and Review Comments.\n\nFor the 'Review Comments' section, output a "Review Highlight Timeline".\n- Instead of listing every event, summarize the review activity for each day.\n- For each day, provide a brief summary of the main review points, status changes, and any important feedback.\n- Clearly indicate the current review status (e.g., "in review", "changes requested", "approved", etc.).\n- If possible, infer the overall review progress and any blockers.\n- Output should be easy to read as a daily timeline for the team to quickly grasp the review situation.`,
        },
      ];

      await client.streamChatCompletion(messages, onToken, options);
    } catch (error) {
      this.handleError(error);
    }
  }
}
