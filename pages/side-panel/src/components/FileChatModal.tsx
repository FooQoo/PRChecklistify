import { useState, useRef, useEffect } from 'react';
import type { PRFile, PRAnalysisResult } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface FileChatModalProps {
  open: boolean;
  onClose: () => void;
  file: PRFile;
  chatHistory: { sender: string; message: string }[];
  onSendMessage: (
    msg: string,
    opts?: { onToken?: (token: string) => void; signal?: AbortSignal; onDone?: () => void },
    context?: { allDiffs?: Record<string, string> },
  ) => Promise<void>;
  onResetChat?: () => void;
  // 他ファイルのdiff情報を渡す
  allDiffs?: Record<string, string>;
  // onChecklistChangeは残す
  analysisResult?: PRAnalysisResult;
  onChecklistChange: (checklistItems: Record<string, 'PENDING' | 'OK' | 'NG'>) => void;
}

const FileChatModal: React.FC<FileChatModalProps> = ({
  open,
  onClose,
  file,
  chatHistory,
  onSendMessage,
  onResetChat,
  allDiffs,
  onChecklistChange,
  analysisResult,
}) => {
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamedMessage, setStreamedMessage] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // チャットコンテナへの参照を追加
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // チャットメッセージ終端への参照を追加
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // checklistItems, aiAnalysisの状態をローカルで管理
  const aiAnalysis = analysisResult?.fileAnalysis?.find(item => item.filename === file.filename);
  const [localChecklistItems, setLocalChecklistItems] = useState<Record<string, 'PENDING' | 'OK' | 'NG'>>({});

  // aiAnalysisが変わったらローカル状態を初期化
  useEffect(() => {
    if (aiAnalysis) {
      const items: Record<string, 'PENDING' | 'OK' | 'NG'> = {};
      aiAnalysis.checklistItems.forEach((item, idx) => {
        items[item.id || `item_${idx}`] = item.status as 'PENDING' | 'OK' | 'NG';
      });
      setLocalChecklistItems(items);
    }
  }, [aiAnalysis]);

  // チャットを一番下までスクロールする関数
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // モーダルが開かれた時に自動スクロール
  useEffect(() => {
    if (open) {
      // setTimeout を使って、DOMが完全に更新された後にスクロールを実行
      setTimeout(scrollToBottom, 0);
    }
  }, [open]);

  // チャット履歴が更新された時に自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // ストリーミングメッセージが更新された時に自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [streamedMessage]);

  // ローカルでリセット機能を処理する
  const handleResetChat = () => {
    if (onResetChat) {
      // 親コンポーネントから提供されたリセット関数を使用
      onResetChat();
    }
  };

  // チェックリストが全てOKになったら自動で完了モーダルを表示
  // useEffect(() => {
  //   if (aiAnalysis && aiAnalysis.checklistItems && aiAnalysis.checklistItems.length > 0 && checklistItems) {
  //     const checklistLength = aiAnalysis.checklistItems.length;
  //     const items = aiAnalysis.checklistItems.map((_, idx) => {
  //       const key = `item_${idx}`;
  //       return checklistItems[key] || aiAnalysis.checklistItems[idx].status;
  //     });
  //     const allChecked = items.length === checklistLength && items.every(s => s === 'OK');
  //     if (allChecked && !showCompleteModal) {
  //       setShowCompleteModal(true);
  //     }
  //   }
  // }, [aiAnalysis, checklistItems, showCompleteModal]);

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
            ファイルレビュー: {file.filename}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
            onClick={onClose}
            aria-label="閉じる">
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
                レビューディスカッション
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={handleResetChat}
                  className="text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 rounded px-2 py-1 flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                  title="ディスカッションをリセット">
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
                  リセット
                </button>
              )}
            </div>
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
                  <p className="text-sm">AI に質問したりフィードバックを送ってみましょう</p>
                </div>
              ) : (
                chatHistory.map((chat, idx) => (
                  <div key={idx} className={`mb-3 ${chat.sender === 'You' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        chat.sender === 'You' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'
                      }`}>
                      <div className="font-semibold text-xs mb-1">
                        {chat.sender === 'You' ? 'あなた' : 'AI レビュアー'}
                      </div>
                      {chat.sender === 'You' ? (
                        <div className="text-left whitespace-pre-wrap">{chat.message}</div>
                      ) : (
                        <MarkdownRenderer content={chat.message} />
                      )}
                    </div>
                  </div>
                ))
              )}
              {streaming && (
                <div className="mb-3">
                  <div className="inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800">
                    <div className="font-semibold text-xs mb-1">AI レビュアー</div>
                    <div className="relative">
                      <MarkdownRenderer content={streamedMessage} />
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
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    チェックリスト
                  </h4>
                  <div className="space-y-2">
                    {aiAnalysis.checklistItems.map((item, idx) => {
                      // checklistItems propがあればそちらを使う
                      const key = `item_${idx}`;
                      const status = (localChecklistItems && localChecklistItems[key]) || item.status;
                      let statusClass = '';
                      if (status === 'OK') statusClass = 'bg-green-500 text-white border-green-500';
                      else if (status === 'NG') statusClass = 'bg-red-500 text-white border-red-500';
                      else statusClass = 'bg-gray-200 text-gray-700 border-gray-300';
                      // checklistItemsとonChecklistChangeがあればトグル可能
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <button
                            type="button"
                            className={`px-2 py-1 rounded text-xs font-bold border transition-colors min-w-[90px] ${statusClass}`}
                            onClick={() => {
                              // 状態をトグル
                              let next: 'OK' | 'NG';
                              if (status === 'NG') {
                                next = 'OK';
                              } else {
                                next = 'NG';
                              }
                              const newChecklistItems = { ...localChecklistItems, [key]: next };
                              setLocalChecklistItems(newChecklistItems);
                              onChecklistChange(newChecklistItems);

                              // すべてのチェックリストがOKの場合、完了モーダルを表示
                              const allChecked = Object.values(newChecklistItems).every(s => s === 'OK');
                              if (allChecked) {
                                setShowCompleteModal(true);
                              }
                            }}>
                            {status}
                          </button>
                          <span className="text-sm">
                            <MarkdownRenderer content={item.description} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
                <h3 className="text-lg font-bold mb-2 text-gray-800">ファイルレビューが完了しました！</h3>
                <p className="mb-6 text-gray-600 text-sm text-center">
                  チェックリストが全てOKになりました。チャット画面を閉じて次のファイルに進みましょう。
                </p>
                <button
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => {
                    setShowCompleteModal(false);
                    onClose();
                  }}>
                  チャット画面を閉じる
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
                onKeyDown={e => {
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
                      abortControllerRef.current = new AbortController();
                      onSendMessage(
                        message,
                        {
                          onToken: (token: string) => setStreamedMessage(prev => prev + token),
                          signal: abortControllerRef.current.signal,
                          onDone: () => {
                            setStreaming(false);
                            // メッセージ送信完了時にも一番下までスクロール
                            setTimeout(scrollToBottom, 0);
                          },
                        },
                        { allDiffs },
                      );
                    }
                  } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                    // 通常のEnterキーは改行として動作（デフォルト動作）
                    // 何もしない（デフォルトのテキストエリアの動作を許可）
                  }
                }}
                placeholder="メッセージを入力してください..."
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
                    abortControllerRef.current = new AbortController();
                    await onSendMessage(
                      currentInput,
                      {
                        onToken: (token: string) => setStreamedMessage(prev => prev + token),
                        signal: abortControllerRef.current.signal,
                        onDone: () => {
                          setStreaming(false);
                          // メッセージ送信完了時にも一番下までスクロール
                          setTimeout(scrollToBottom, 0);
                        },
                      },
                      { allDiffs },
                    );
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
