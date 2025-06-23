export interface PrComment {
  domain: string;
  org: string;
  repo: string;
  pr_id: number;
  body: string;
  author: string | null;
  created_at: string;
  line: number | null;
  filename: string | null;
}

export interface PrFileDiff {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface PrData {
  domain: string;
  org: string;
  repo: string;
  pr_id: number;
  title: string;
  body: string;
  author: string | null;
  created_at: string;
  merged: boolean;
  merged_at: string | null;
  state: string;
  comments: PrComment[];
  files: PrFileDiff[];
  embedding: number[];
  text: string;
}
