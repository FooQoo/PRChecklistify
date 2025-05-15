import { useState, useRef } from 'react';
import type { PRFile } from '../types';

interface FileChatModalProps {
  open: boolean;
  onClose: () => void;
  file: PRFile;
  chatHistory: { sender: string; message: string }[];
  onSendMessage: (
    msg: string,
    opts?: { onToken?: (token: string) => void; signal?: AbortSignal; onDone?: () => void },
  ) => Promise<void>;
  onApprove: () => void;
  onPending: () => void;
  status: 'APPROVED' | 'PENDING' | null;
}

const FileChatModal: React.FC<FileChatModalProps> = ({
  open,
  onClose,
  file,
  chatHistory,
  onSendMessage,
  onApprove,
  onPending,
}) => {
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamedMessage, setStreamedMessage] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full h-full max-w-2xl max-h-none p-6 relative flex flex-col">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2 flex items-center gap-4">
          ファイルレビュー: {file.filename}
        </h2>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* チャット履歴 */}
          <div className="rounded-md border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 flex items-center">
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
            <div className="flex-1 overflow-y-auto p-3 bg-white min-h-0">
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
                      <div className="text-left whitespace-pre-wrap">{chat.message}</div>
                    </div>
                  </div>
                ))
              )}
              {streaming && (
                <div className="mb-3">
                  <div className="inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800">
                    <div className="font-semibold text-xs mb-1">AI レビュアー</div>
                    <div className="whitespace-pre-wrap">
                      {streamedMessage}
                      <span className="ml-1 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      <span
                        className="ml-1 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: '0.2s' }}></span>
                      <span
                        className="ml-1 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* メッセージ入力 */}
          <div className="relative border rounded-md overflow-hidden mt-2">
            <textarea
              className="w-full px-3 py-2 border-0 focus:ring-0 resize-none"
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="メッセージを入力してください..."
              disabled={streaming}
            />
            <div className="absolute right-2 bottom-2 flex gap-2">
              {streaming && (
                <button
                  className="inline-flex items-center rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => {
                    abortControllerRef.current?.abort();
                    setStreaming(false);
                    setStreamedMessage('');
                  }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  停止
                </button>
              )}
              <button
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={async () => {
                  if (!input.trim() || streaming) return;
                  setStreaming(true);
                  setStreamedMessage('');
                  abortControllerRef.current = new AbortController();
                  await onSendMessage(input, {
                    onToken: (token: string) => setStreamedMessage(prev => prev + token),
                    signal: abortControllerRef.current.signal,
                    onDone: () => setStreaming(false),
                  });
                  setInput('');
                  setStreaming(false);
                  setStreamedMessage('');
                }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
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
                送信
              </button>
            </div>
          </div>
        </div>

        {/* APPROVED/PENDING ボタン */}
        <div className="flex justify-end mt-6 gap-2 pt-4 border-t">
          <button
            className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            onClick={onPending}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            PENDING
          </button>
          <button
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={onApprove}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            APPROVED
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileChatModal;
