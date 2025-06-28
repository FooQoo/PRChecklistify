import { NextResponse } from 'next/server';
import type { PRFile, PRAnalysisResult, ChecklistItemStatus } from '../../../types';

// aiService.tsのロジックを模倣したダミーのAI分析関数
const generateMockAnalysis = async (files: PRFile[]): Promise<PRAnalysisResult> => {
  // 実際のAI呼び出しの待機時間をシミュレート
  await new Promise(resolve => setTimeout(resolve, 1500));

  // generateSummaryStreamの出力を模倣したダミーの要約
  const summary = `### 背景と課題
このプルリクエストは、ユーザーインターフェースの主要なコンポーネントを更新し、パフォーマンスを向上させることを目的としています。既存のコンポーネントには描画のボトルネックがあり、ユーザー体験に影響を与えていました。

### 解決策と実装
- \`feature.tsx\` コンポーネントを仮想化リスト（Virtual List）を使ってリファクタリングし、大量のデータを効率的に表示できるようにしました。
- スタイリングを \`main.css\` に集約し、CSS変数を導入することで、テーマの変更を容易にしました。

### レビューハイライト
**現在状況:** レビュー中

- **昨日:** スタイルの変更に関するいくつかのフィードバックがあり、修正がプッシュされました。
- **本日:** 仮想化リストの実装について、さらなるテストを求めるコメントがありました。

全体として、変更は正しい方向に向かっていますが、リリース前にパフォーマンスの再検証が必要です。`;

  // generateChecklistの出力を模倣したダミーのファイル分析
  const fileAnalysis = files.map(file => {
    const checklistItems = [];
    if (file.filename.endsWith('.tsx')) {
      checklistItems.push(
        {
          id: `${file.filename}-1`,
          description: 'コンポーネントのロジックは明確か',
          status: 'PENDING' as ChecklistItemStatus,
        },
        { id: `${file.filename}-2`, description: 'Propsの型定義は適切か', status: 'PENDING' as ChecklistItemStatus },
        {
          id: `${file.filename}-3`,
          description: '再利用性と保守性は考慮されているか',
          status: 'PENDING' as ChecklistItemStatus,
        },
      );
    } else if (file.filename.endsWith('.css')) {
      checklistItems.push(
        {
          id: `${file.filename}-1`,
          description: 'スタイルがデザインシステムに準拠しているか',
          status: 'PENDING' as ChecklistItemStatus,
        },
        {
          id: `${file.filename}-2`,
          description: '命名規則（例: BEM）は一貫しているか',
          status: 'PENDING' as ChecklistItemStatus,
        },
      );
    }
    return {
      filename: file.filename,
      explanation: `このファイルは${file.additions}行追加、${file.deletions}行削除されました。`,
      checklistItems,
    };
  });

  return {
    summary,
    fileAnalysis,
  };
};

export async function POST(_request: Request) {
  try {
    // デモなので、リクエストボディは使わずダミーファイルリストを使用
    const dummyPRFiles: PRFile[] = [
      {
        filename: 'src/components/feature.tsx',
        status: 'modified',
        additions: 25,
        deletions: 10,
        patch: '...',
        contents_url: '',
        decodedContent: '',
      },
      {
        filename: 'src/styles/main.css',
        status: 'added',
        additions: 15,
        deletions: 0,
        patch: '...',
        contents_url: '',
        decodedContent: '',
      },
    ];

    const analysisResult = await generateMockAnalysis(dummyPRFiles);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error in /api/analyze-pr:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to analyze PR.', details: errorMessage }, { status: 500 });
  }
}
