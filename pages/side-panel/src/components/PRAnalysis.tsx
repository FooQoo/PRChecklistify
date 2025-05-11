import { useState, useEffect } from 'react';
import type { ChecklistItemStatus, PRAnalysisResult, PRData } from '../types';
import { languagePreferenceStorage } from '@extension/storage';
import { fetchers } from '@src/services/aiService';
import FileChecklist from './FileChecklist';

interface PRAnalysisProps {
  prData: PRData;
  url: string;
  analysisResult: PRAnalysisResult | undefined;
  saveAnalysisResult: (result: PRAnalysisResult | undefined) => void;
}

const PRAnalysis: React.FC<PRAnalysisProps> = ({ prData, url, analysisResult, saveAnalysisResult }) => {
  const [generating, setGenerating] = useState(false);
  const [language, setLanguage] = useState<string>('en');
  const [error, setError] = useState<string | null>(null);

  // 言語設定を読み込む
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await languagePreferenceStorage.get();
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    };

    loadLanguage();
  }, []);

  // AI分析を生成する
  const generateAnalysis = async () => {
    if (!prData || generating) return;

    try {
      setGenerating(true);
      setError(null);
      saveAnalysisResult(undefined); // Reset analysis result

      // Generate analysis using the fetcher
      const generatedAnalysis = await fetchers.generateAnalysis(url, prData, language);

      // デバッグ用
      console.log('Generated analysis result:', generatedAnalysis);

      // 分析結果を更新
      saveAnalysisResult(generatedAnalysis);
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError('Failed to generate analysis. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!prData) {
    return null;
  }

  // チェックリスト変更時のハンドラー
  const handleChecklistChange = (filename: string, checklistItems: Record<string, 'PENDING' | 'OK' | 'NG'>) => {
    if (!prData || !analysisResult) return;

    // 分析結果のファイルチェックリストを更新する
    const updatedFileChecklists = analysisResult.fileAnalysis.map(checklist => {
      if (checklist.filename === filename) {
        // ステータスマッピングしたチェックリストアイテムを作成
        const updatedItems = checklist.checklistItems.map((item, index) => {
          const key = `item_${index}`;
          if (checklistItems[key]) {
            return { ...item, status: checklistItems[key] as ChecklistItemStatus };
          }
          return item;
        });
        return { ...checklist, checklistItems: updatedItems };
      }
      return checklist;
    });

    // 更新後の分析結果オブジェクトを作成
    const updatedAnalysisResult = {
      ...analysisResult,
      fileChecklists: updatedFileChecklists,
    };

    // 分析結果を更新
    saveAnalysisResult(updatedAnalysisResult);
  };

  return (
    <>
      <div className="pr-analysis p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">PR Analysis</h3>
          {!generating && (
            <button
              onClick={generateAnalysis}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm">
              {!analysisResult ? 'Generate Analysis' : 'Regenerate Analysis'}
            </button>
          )}
          {generating && (
            <div className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </div>
          )}
        </div>

        {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3">{error}</div>}

        {analysisResult ? (
          <div>
            <div className="pr-summary mb-4">
              <div className="bg-gray-50 p-3 rounded-md text-left text-sm">
                <div className="mb-2">
                  <span className="font-medium">Background:</span>{' '}
                  <span className="font-normal">{analysisResult.summary.background}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Problem:</span>{' '}
                  <span className="font-normal">{analysisResult.summary.problem}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Solution:</span>{' '}
                  <span className="font-normal">{analysisResult.summary.solution}</span>
                </div>
                <div>
                  <span className="font-medium">Implementation:</span>{' '}
                  <span className="font-normal">{analysisResult.summary.implementation}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
            {generating
              ? 'Analyzing your PR. This may take a moment...'
              : "Click 'Generate Analysis' to get AI-powered insights about this PR."}
          </div>
        )}
      </div>
      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
          <div className="changed-files p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm w-full text-left">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">Changed Files</h3>
            </div>

            <div className="detailed-checklists">
              {prData.files.map((file, index) => {
                // Find AI-generated checklist for this file if available
                const aiGeneratedChecklist = analysisResult?.fileAnalysis.find(
                  checklist => checklist.filename === file.filename,
                );

                return (
                  <FileChecklist
                    key={index}
                    file={file}
                    onChecklistChange={handleChecklistChange}
                    aiGeneratedChecklist={aiGeneratedChecklist}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PRAnalysis;
