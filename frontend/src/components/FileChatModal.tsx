import { useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import type { PRData, PRFile } from '@extension/shared';
import MarkdownRenderer from './MarkdownRenderer';

interface FileChatModalProps {
  open: boolean;
  onClose: () => void;
  file: PRFile;
  prData: PRData;
}

const FileChatModal: React.FC<FileChatModalProps> = ({ open, onClose, file, prData }) => {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    body: {
      prData,
      file,
      language: 'ja',
    },
    onError: err => {
      console.error('Chat error:', err);
    },
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 0);
    }
  }, [open, messages]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-2xl max-h-none flex flex-col border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center p-3 bg-gray-100 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">ファイルレビュー: {file.filename}</h2>
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
          <div className="rounded-md border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
              レビューディスカッション
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 rounded px-2 py-1 flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                  title="ディスカッションをリセット">
                  リセット
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 pb-20 bg-white min-h-0">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  <p className="text-sm">AI に質問したりフィードバックを送ってみましょう</p>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`mb-3 ${m.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        m.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'
                      }`}>
                      <div className="font-semibold text-xs mb-1">{m.role === 'user' ? 'あなた' : 'AI レビュアー'}</div>
                      <MarkdownRenderer content={m.content} />
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="absolute left-6 right-6 bottom-[30px] z-10">
            <form onSubmit={handleSubmit}>
              <div className="border border-gray-300 rounded-lg shadow-md bg-white overflow-hidden flex items-end">
                <textarea
                  className="w-full px-3 py-2 border-0 focus:ring-0 resize-none text-gray-800 min-h-[36px] max-h-[150px] outline-none text-sm flex-grow overflow-auto"
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="メッセージを入力してください..."
                  disabled={isLoading}
                />
                <div className="px-2 py-1 flex justify-end items-center">
                  <button
                    className={`rounded-md p-2 transition-colors flex items-center justify-center ${
                      !input.trim() || isLoading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                    }`}
                    disabled={!input.trim() || isLoading}
                    type="submit">
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileChatModal;
