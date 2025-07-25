import { useState, useRef, useEffect, useCallback } from 'react';
import type { PRFile, PRAnalysisResult, Checklist, PRData } from '../../types';
import { MarkdownRenderer, ChecklistComponent } from '../molecules';
import { useI18n } from '@extension/i18n';
import { getLocalizedErrorMessage } from '@src/utils/errorUtils';
import { aiService, prDataStorageService } from '@src/di';

interface FileChatModalProps {
  open: boolean;
  onClose: () => void;
  file: PRFile;
  prKey: string;
  prData: PRData;
  // 分析結果とチェックリスト変更ハンドラー
  analysisResult?: PRAnalysisResult | null;
  onChecklistChange: (updatedChecklist: Checklist) => void;
}

const FileChatModal: React.FC<FileChatModalProps> = ({
  open,
  onClose,
  file,
  prKey,
  prData,
  onChecklistChange,
  analysisResult,
}) => {
  const { t, language } = useI18n();
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamedMessage, setStreamedMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ sender: string; message: string }[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // チャットコンテナへの参照を追加
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // チャットメッセージ終端への参照を追加
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // AI分析結果を取得
  const aiAnalysis = analysisResult?.fileAnalysis?.find(item => item.filename === file.filename);

  // チャットを一番下までスクロールする関数（メモ化）
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  // モーダル開閉とチャット履歴読み込み処理を統合
  useEffect(() => {
    if (!open) return;

    setError(null);

    // チャット履歴をストレージから読み込み
    if (file.filename) {
      prDataStorageService
        .getFileChatHistoriesFromStorage(prKey, file.filename)
        .then(saved => {
          setChatHistory(saved);
          // 履歴読み込み完了後にスクロール
          setTimeout(scrollToBottom, 0);
        })
        .catch(() => {
          setChatHistory([]);
          setTimeout(scrollToBottom, 0);
        });
    }
  }, [open, prKey, file.filename, scrollToBottom]);

  // チャット履歴とストリーミングメッセージの変更時にスクロール
  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [chatHistory, streamedMessage, open, scrollToBottom]);

  // チャット履歴をストレージに保存する関数
  const saveChatHistoryToStorage = (newHistory: { sender: string; message: string }[]) => {
    prDataStorageService
      .getAllFileChatHistoriesFromStorage(prKey)
      .then(existingHistories => {
        const updated = {
          ...existingHistories,
          [file.filename]: newHistory,
        };
        return prDataStorageService.saveFileChatHistoriesToStorage(prKey, updated);
      })
      .catch(() => {
        // エラーの場合は新しい履歴だけ保存
        const updated = { [file.filename]: newHistory };
        return prDataStorageService.saveFileChatHistoriesToStorage(prKey, updated);
      });
  };

  // チャットメッセージ送信処理
  const handleSendMessage = async (
    msg: string,
    opts?: { onToken?: (token: string) => void; signal?: AbortSignal; onDone?: () => void },
  ) => {
    const newUserMessage = { sender: 'You', message: msg };
    const updatedHistoryWithUser = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistoryWithUser);

    let aiMsg = '';
    try {
      const allDiffs = Object.fromEntries(prData.files.map(f => [f.filename, f.patch || '']));

      await aiService.streamFileChat(
        prData,
        file,
        updatedHistoryWithUser,
        (token: string) => {
          aiMsg += token;
          if (opts?.onToken) opts.onToken(token);
        },
        language,
        { signal: opts?.signal },
        allDiffs,
      );

      const newAiMessage = { sender: 'AI', message: aiMsg };
      const finalHistory = [...updatedHistoryWithUser, newAiMessage];
      setChatHistory(finalHistory);
      saveChatHistoryToStorage(finalHistory);
    } catch (error) {
      const newAiMessage = { sender: 'AI', message: aiMsg || t('aiResponseInterrupted') };
      const finalHistory = [...updatedHistoryWithUser, newAiMessage];
      setChatHistory(finalHistory);
      saveChatHistoryToStorage(finalHistory);
      throw error;
    } finally {
      if (opts?.onDone) opts.onDone();
    }
  };

  // チャットリセット処理
  const handleResetChat = () => {
    setChatHistory([]);
    saveChatHistoryToStorage([]);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-2xl max-h-none flex flex-col border border-gray-200 overflow-hidden">
        {/* ヘッダー部分 - 他のコンポーネントと統一感を持たせる */}
        <div className="flex justify-between items-center p-3 bg-gray-100 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {t('fileReview')}: {file.filename}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
            onClick={onClose}
            aria-label={t('close')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 p-4 relative">
          {/* チャット履歴 */}
          <div className="rounded-md border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
            {/* チャットヘッダー */}
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                {t('reviewDiscussion')}
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={handleResetChat}
                  className="text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 rounded px-2 py-1 flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                  title={t('reset')}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {t('reset')}
                </button>
              )}
            </div>
            {error && <div className="bg-red-100 border border-red-300 text-red-700 text-sm px-3 py-2">{error}</div>}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 pb-20 bg-white min-h-0">
              {/* チャット履歴 */}
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mx-auto mb-2 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-sm">{t('askAiPrompt')}</p>
                </div>
              ) : (
                chatHistory.map((chat, idx) => (
                  <div key={idx} className={`mb-3 ${chat.sender === 'You' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        chat.sender === 'You' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'
                      }`}>
                      <div className="font-semibold text-xs mb-1">
                        {chat.sender === 'You' ? t('you') : t('aiReviewer')}
                      </div>
                      <MarkdownRenderer
                        content={chat.message}
                        className="text-left"
                        codeTheme={chat.sender === 'You' ? 'blue' : 'default'}
                      />
                    </div>
                  </div>
                ))
              )}
              {streaming && (
                <div className="mb-3">
                  <div className="inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800">
                    <div className="font-semibold text-xs mb-1">{t('aiReviewer')}</div>
                    <div className="relative">
                      <MarkdownRenderer content={streamedMessage} codeTheme="default" />
                      <div className="mt-1">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span
                          className="ml-1 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                          style={{ animationDelay: '0.2s' }}></span>
                        <span
                          className="ml-1 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                          style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* チェックリスト表示 */}
              {aiAnalysis && aiAnalysis.checklistItems && aiAnalysis.checklistItems.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <ChecklistComponent
                    checklist={aiAnalysis}
                    onToggle={itemIndex => {
                      const updatedChecklistItems = aiAnalysis.checklistItems.map((item, index) => {
                        if (index === itemIndex) {
                          return { ...item, isChecked: !item.isChecked };
                        }
                        return item;
                      });

                      const updatedChecklist = {
                        ...aiAnalysis,
                        checklistItems: updatedChecklistItems,
                      };

                      onChecklistChange(updatedChecklist);

                      const allChecked = updatedChecklistItems.every(item => item.isChecked);
                      if (allChecked) {
                        setShowCompleteModal(true);
                      }
                    }}
                    onExpand={() => setTimeout(scrollToBottom, 0)}
                    defaultExpanded={false}
                  />
                </div>
              )}
              {/* チャットメッセージの終端 */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 完了モーダル */}
          {showCompleteModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full flex flex-col items-center border border-gray-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">{t('reviewComplete')}</h3>
                <p className="mb-6 text-gray-600 text-sm text-center">{t('allChecklistDone')}</p>
                <button
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => {
                    setShowCompleteModal(false);
                    onClose();
                  }}>
                  {t('closeChat')}
                </button>
              </div>
            </div>
          )}

          {/* メッセージ入力 - ChatGPTライクデザイン (より下部に配置) */}
          <div className="absolute left-6 right-6 bottom-[30px] z-10">
            {' '}
            {/* bottom-[70px]でより下部に配置 - 承認ボタンと重ならないよう調整 */}
            <div className="border border-gray-300 rounded-lg shadow-md bg-white overflow-hidden flex items-end">
              <textarea
                ref={textareaRef}
                className="w-full px-3 py-2 border-0 focus:ring-0 resize-none text-gray-800 min-h-[36px] max-h-[150px] outline-none text-sm flex-grow overflow-auto"
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  // テキストエリアの高さを自動調整
                  const textarea = textareaRef.current;
                  if (textarea) {
                    textarea.style.height = 'auto';
                    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
                  }
                }}
                onKeyDown={async e => {
                  // Ctrl+Enter（Macの場合はCmd+Enter）で送信
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (input.trim() && !streaming) {
                      const message = input;
                      setInput('');
                      // テキストエリアの高さをリセット
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                      }
                      setStreaming(true);
                      setStreamedMessage('');
                      setError(null);
                      abortControllerRef.current = new AbortController();
                      try {
                        await handleSendMessage(message, {
                          onToken: (token: string) => setStreamedMessage(prev => prev + token),
                          signal: abortControllerRef.current.signal,
                          onDone: () => {
                            setStreaming(false);
                            // メッセージ送信完了時にも一番下までスクロール
                            setTimeout(scrollToBottom, 0);
                          },
                        });
                      } catch (err) {
                        setStreaming(false);
                        setError(getLocalizedErrorMessage(err, t));
                      }
                    }
                  } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                    // 通常のEnterキーは改行として動作（デフォルト動作）
                    // 何もしない（デフォルトのテキストエリアの動作を許可）
                  }
                }}
                placeholder={t('enterMessage')}
                disabled={streaming}
              />
              <div className="px-2 py-1 flex justify-end items-center">
                {streaming && (
                  <button
                    className="inline-flex items-center rounded-full bg-red-100 p-1.5 text-xs font-medium text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors mr-2"
                    onClick={() => {
                      abortControllerRef.current?.abort();
                      setStreaming(false);
                      setStreamedMessage('');
                    }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  className={`rounded-md p-2 transition-colors flex items-center justify-center ${
                    !input.trim() || streaming
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                  }`}
                  disabled={!input.trim() || streaming}
                  onClick={async () => {
                    if (!input.trim() || streaming) return;

                    const currentInput = input;
                    setInput('');
                    // テキストエリアの高さをリセット
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                    }
                    setStreaming(true);
                    setStreamedMessage('');
                    setError(null);
                    abortControllerRef.current = new AbortController();
                    try {
                      await handleSendMessage(currentInput, {
                        onToken: (token: string) => setStreamedMessage(prev => prev + token),
                        signal: abortControllerRef.current.signal,
                        onDone: () => {
                          setStreaming(false);
                          // メッセージ送信完了時にも一番下までスクロール
                          setTimeout(scrollToBottom, 0);
                        },
                      });
                    } catch (err) {
                      setStreaming(false);
                      setError(getLocalizedErrorMessage(err, t));
                    }
                  }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileChatModal;
