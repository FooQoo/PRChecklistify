// GitHub PR データの型定義
export interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  contents_url: string;
  raw_url: string;
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
  mergeable: boolean | null;
  rebaseable: boolean | null;
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
  url: string;
  data: PRData;
  timestamp: number;
  analysisResult?: PRAnalysisResult;
}

// 現在のページ情報の型
export interface CurrentPage {
  url: string;
  title: string;
}

// チェックリストアイテムのステータス
export type ChecklistItemStatus = 'OK' | 'WARNING' | 'ERROR' | 'PENDING';

// チェックリストアイテムの型
export interface ChecklistItem {
  id: string;
  description: string;
  filename: string;
  status: ChecklistItemStatus;
  suggestion?: string;
  lineNumbers?: number[];
}

// ファイルチェックリストの型
export interface FileChecklist {
  id: string;
  filename: string;
  checklistItems: ChecklistItem[];
}

// PR分析結果の概要
export interface PRAnalysisSummary {
  background: string;
  problem: string;
  solution: string;
  implementation: string;
}

// PR分析結果の型
export interface PRAnalysisResult {
  summary: PRAnalysisSummary;
  fileChecklists: FileChecklist[];
  reviewTime: {
    minutes: number;
    level: 'quick' | 'moderate' | 'detailed';
  };
  generated: {
    timestamp: number;
    model: string;
  };
}
