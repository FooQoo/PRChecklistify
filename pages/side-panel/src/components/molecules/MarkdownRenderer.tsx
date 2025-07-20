import type React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  codeTheme?: 'default' | 'blue';
}

/**
 * マークダウンを美しくレンダリングするコンポーネント
 * @param content - レンダリングするマークダウン文字列
 * @param className - 追加のCSSクラス（オプション）
 * @param codeTheme - コードブロックのテーマ（default | blue）
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  codeTheme = 'default',
}) => {
  // コードブロックのテーマ設定
  const getCodeBlockStyles = (theme: string) => {
    switch (theme) {
      case 'blue':
        return 'bg-blue-100';
      default:
        return 'bg-gray-800';
    }
  };

  const getInlineCodeStyles = (theme: string) => {
    switch (theme) {
      case 'blue':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 見出し要素のカスタマイズ
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-bold" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-bold" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-base font-bold" {...props}>
              {children}
            </h4>
          ),

          // リスト要素のカスタマイズ
          ul: ({ ...props }) => <ul className="list-disc pl-5" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5" {...props} />,
          li: ({ ...props }) => <li {...props} />,

          // その他の要素のカスタマイズ
          p: ({ ...props }) => <p {...props} />,
          a: ({ children, ...props }) => (
            <a className="text-blue-600 hover:underline" {...props}>
              {children}
            </a>
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />
          ),

          // コードブロックのカスタマイズ
          code: ({ className, ...props }) =>
            className?.includes('language-') ? (
              <code
                className={`block p-4 rounded-md overflow-x-auto text-sm my-4 ${getCodeBlockStyles(codeTheme)}`}
                {...props}
              />
            ) : (
              <code className={`px-1 py-0.5 rounded text-sm ${getInlineCodeStyles(codeTheme)}`} {...props} />
            ),
          pre: ({ ...props }) => <pre className="bg-transparent p-0" {...props} />,

          // テーブル要素のカスタマイズ
          table: ({ ...props }) => <table className="min-w-full border-collapse my-4" {...props} />,
          thead: ({ ...props }) => <thead className="bg-gray-100" {...props} />,
          tbody: ({ ...props }) => <tbody className="divide-y divide-gray-200" {...props} />,
          tr: ({ ...props }) => <tr className="hover:bg-gray-50" {...props} />,
          th: ({ ...props }) => <th className="px-4 py-2 text-left font-medium text-gray-700" {...props} />,
          td: ({ ...props }) => <td className="px-4 py-2" {...props} />,

          // 水平線のカスタマイズ
          hr: ({ ...props }) => <hr className="my-6 border-t border-gray-300" {...props} />,
        }}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
