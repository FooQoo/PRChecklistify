// GitHub PR データの型定義
export interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
  contents_url: string;
  decodedContent?: string; // 追加: base64デコードした内容
}

export interface PRData {
  id: number;
  number: number;
  title: string;
  state: string;
  body: string | null;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
  files: PRFile[];
  commits: number;
  comments: number;
  review_comments: number;
  instructions?: string;
  readme?: string;
  userComments?: PRUserComment[]; // ユーザコメント情報を追加
}

/**
 * PRに紐づくユーザコメント情報
 */
export interface PRUserComment {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  path: string;
  body: string;
  created_at: string;
  updated_at: string;
  url: string;
}

// リポジトリの所有者、名前、PR番号の情報
export interface PRIdentifier {
  owner: string;
  repo: string;
  prNumber: string;
  domain: string;
}

// 保存されたPRデータの型
export interface SavedPRData {
  key: string; // "owner/repo/prNumber" 形式のキー
  data: PRData;
  timestamp: number;
  analysisResult?: PRAnalysisResult;
}

// チェックリストアイテムの型
export interface ChecklistItem {
  id: string;
  description: string;
  isChecked: boolean;
}

// ファイルチェックリストの型
export interface Checklist {
  filename: string;
  explanation?: string; // AI分析後に設定される（初期状態はundefined）
  checklistItems: ChecklistItem[]; // 初期状態は空配列
  isClose: boolean; // エクスパンドが閉じられているかどうか（初期状態はfalse）
}

// PR分析結果の型
export interface PRAnalysisResult {
  summary?: string; // AI分析後に設定される（初期状態はundefined）
  fileAnalysis: Checklist[]; // 各ファイルごとに初期状態で作成される
}

// LLMサービスプロバイダーの型定義
export interface LLMModel {
  id: string;
  name: string;
  maxTokens: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  tokenRegistrationUrl: string;
  defaultModel: string;
  models: LLMModel[];
}

export interface LLMServiceConfig {
  llmServices: {
    providers: LLMProvider[];
  };
}
