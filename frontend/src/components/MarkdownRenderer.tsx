import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * マークダウンを美しくレンダリングするコンポーネント
 * @param content - レンダリングするマークダウン文字列
 * @param className - 追加のCSSクラス（オプション）
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 見出し要素のカスタマイズ
          h1: ({ node: _, children, ...props }) => (
            <h1 className="text-2xl font-bold" {...props}>
              {children}
            </h1>
          ),
          h2: ({ node: _, children, ...props }) => (
            <h2 className="text-xl font-bold" {...props}>
              {children}
            </h2>
          ),
          h3: ({ node: _, children, ...props }) => (
            <h3 className="text-lg font-bold" {...props}>
              {children}
            </h3>
          ),
          h4: ({ node: _, children, ...props }) => (
            <h4 className="text-base font-bold" {...props}>
              {children}
            </h4>
          ),

          // リスト要素のカスタマイズ
          ul: ({ node: _, ...props }) => <ul className="list-disc pl-5" {...props} />,
          ol: ({ node: _, ...props }) => <ol className="list-decimal pl-5" {...props} />,
          li: ({ node: _, ...props }) => <li {...props} />,

          // その他の要素のカスタマイズ
          p: ({ node: _, ...props }) => <p {...props} />,
          a: ({ node: _, children, ...props }) => (
            <a className="text-blue-600 hover:underline" {...props}>
              {children}
            </a>
          ),
          blockquote: ({ node: _, ...props }) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />
          ),

          // コードブロックのカスタマイズ
          code: ({ node: _, className, ...props }) =>
            className?.includes('language-') ? (
              <code className="block bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm my-4" {...props} />
            ) : (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
            ),
          pre: ({ node: _, ...props }) => <pre className="bg-transparent p-0" {...props} />,

          // テーブル要素のカスタマイズ
          table: ({ node: _, ...props }) => <table className="min-w-full border-collapse my-4" {...props} />,
          thead: ({ node: _, ...props }) => <thead className="bg-gray-100" {...props} />,
          tbody: ({ node: _, ...props }) => <tbody className="divide-y divide-gray-200" {...props} />,
          tr: ({ node: _, ...props }) => <tr className="hover:bg-gray-50" {...props} />,
          th: ({ node: _, ...props }) => <th className="px-4 py-2 text-left font-medium text-gray-700" {...props} />,
          td: ({ node: _, ...props }) => <td className="px-4 py-2" {...props} />,

          // 水平線のカスタマイズ
          hr: ({ node: _, ...props }) => <hr className="my-6 border-t border-gray-300" {...props} />,
        }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
