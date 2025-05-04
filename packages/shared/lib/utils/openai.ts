// OpenAI API integration for PR checklist generation
import OpenAI from 'openai';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  apiEndpoint?: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  status: 'PENDING' | 'OK' | 'NG';
}

export interface FileChecklist {
  filename: string;
  checklistItems: ChecklistItem[];
}

export interface PRAnalysisResult {
  summary: {
    background: string;
    problem: string;
    solution: string;
    implementation: string;
  };
  fileChecklists: FileChecklist[];
}

class OpenAIClient {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiEndpoint,
      dangerouslyAllowBrowser: true, // Add this flag to allow browser usage
    });
    this.model = config.model || 'gpt-4-turbo';
  }

  /**
   * Analyze a PR and generate checklist and summary
   */
  async analyzePR(prData: any): Promise<PRAnalysisResult> {
    try {
      const prompt = this.buildPRAnalysisPrompt(prData);
      const response = await this.callOpenAI(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Error analyzing PR with OpenAI:', error);
      throw new Error('Failed to analyze PR with OpenAI');
    }
  }

  /**
   * Build the prompt for PR analysis
   */
  private buildPRAnalysisPrompt(prData: any): string {
    // Format the PR data for the prompt
    const { title, description, files } = prData;

    // List of changed files with stats and patches
    const fileChanges = files
      .map((file: any) => {
        return `
File: ${file.filename} (${file.status})
Changes: +${file.additions} -${file.deletions}
${file.patch ? `Patch:\n${file.patch}` : 'No patch available'}
`;
      })
      .join('\n---\n');

    // Construct the full prompt
    return `
Analyze this pull request and provide:
1. A summary of the PR, including:
   - Background
   - Problem being solved
   - Solution approach
   - Implementation details

2. For each changed file, create a checklist of specific items to review, focusing on:
   - Code correctness
   - Best practices
   - Potential bugs
   - Performance concerns
   - Security implications

PR Title: ${title}
PR Description: ${description}

Changed Files:
${fileChanges}

Format your response as a JSON object with the following structure:
{
  "summary": {
    "background": "...",
    "problem": "...",
    "solution": "...",
    "implementation": "..."
  },
  "fileChecklists": [
    {
      "filename": "path/to/file.ts",
      "checklistItems": [
        {
          "id": "item-1",
          "description": "Check that...",
          "status": "PENDING"
        },
        ...more items
      ]
    },
    ...more files
  ]
}
`;
  }

  /**
   * Make the API call to OpenAI
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a senior software developer conducting a thorough code review. You provide detailed, actionable feedback in JSON format as requested.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  /**
   * Parse the OpenAI response into a structured format
   */
  private parseAnalysisResponse(responseText: string): PRAnalysisResult {
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(responseText);

      // Ensure all file checklist items have IDs
      const fileChecklists = parsedResponse.fileChecklists.map((fileChecklist: any) => ({
        ...fileChecklist,
        checklistItems: fileChecklist.checklistItems.map((item: any, index: number) => ({
          id: item.id || `${fileChecklist.filename}-item-${index}`,
          description: item.description,
          status: item.status || 'PENDING',
        })),
      }));

      return {
        summary: parsedResponse.summary,
        fileChecklists,
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse OpenAI response');
    }
  }
}

// Storage for OpenAI API key
export const openaiApiKeyStorage = {
  get: async (): Promise<string | null> => {
    try {
      const result = await chrome.storage.local.get('openaiApiKey');
      return result.openaiApiKey || null;
    } catch (error) {
      console.error('Error getting OpenAI API key:', error);
      return null;
    }
  },

  set: async (apiKey: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ openaiApiKey: apiKey });
    } catch (error) {
      console.error('Error setting OpenAI API key:', error);
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('openaiApiKey');
    } catch (error) {
      console.error('Error clearing OpenAI API key:', error);
      throw error;
    }
  },
};

// Create and export OpenAI client instance
export const createOpenAIClient = async (): Promise<OpenAIClient | null> => {
  const apiKey = await openaiApiKeyStorage.get();
  if (!apiKey) {
    return null;
  }

  return new OpenAIClient({
    apiKey,
    model: 'gpt-4-turbo',
  });
};

export default OpenAIClient;
