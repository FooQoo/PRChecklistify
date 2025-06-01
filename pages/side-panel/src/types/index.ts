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
}

// リポジトリの所有者、名前、PR番号の情報
export interface PRIdentifier {
  owner: string;
  repo: string;
  prNumber: string;
}

// 保存されたPRデータの型
export interface SavedPRData {
  key: string; // "owner/repo/prNumber" 形式のキー
  data: PRData;
  timestamp: number;
  analysisResult?: PRAnalysisResult;
}

// 現在のページ情報の型
export interface CurrentPage {
  url: string;
  title: string;
  key?: string; // "owner/repo/prNumber" 形式のキー
  isPRPage?: boolean;
}

// チェックリストアイテムのステータス
export type ChecklistItemStatus = 'OK' | 'WARNING' | 'ERROR' | 'PENDING';

// チェックリストアイテムの型
export interface ChecklistItem {
  id: string;
  description: string;
  status: ChecklistItemStatus;
}

// ファイルチェックリストの型
export interface FileChecklist {
  filename: string;
  explanation: string;
  checklistItems: ChecklistItem[];
}

// PR分析結果の型
export interface PRAnalysisResult {
  summary: string;
  fileAnalysis: FileChecklist[];
  prompt: string;
}
