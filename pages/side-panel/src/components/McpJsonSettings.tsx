import { useState, useEffect } from 'react';
import { useMcpJsonAtom } from '../hooks/useMcpJsonAtom';

interface McpJsonSettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

/**
 * MCP用のJSON設定を管理するコンポーネント
 */
const McpJsonSettings: React.FC<McpJsonSettingsProps> = ({ onToast }) => {
  const { mcpJson, setJsonAndStorage, clearJson, isMcpJsonLoaded } = useMcpJsonAtom();
  const [jsonValue, setJsonValue] = useState(mcpJson);
  const [error, setError] = useState<string | null>(null);

  // jotai atomの値が変わったらローカルstateも同期
  useEffect(() => {
    setJsonValue(mcpJson);
  }, [mcpJson]);

  // 入力変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonValue(e.target.value);
    setError(null);
  };

  // 保存ハンドラ
  const handleSave = async () => {
    try {
      if (jsonValue.trim()) {
        JSON.parse(jsonValue);
      }
      await setJsonAndStorage(jsonValue);
      onToast('MCP JSON設定を保存しました', 'success');
    } catch {
      setError('有効なJSONを入力してください');
      onToast('JSONの保存に失敗しました', 'error');
    }
  };

  // クリアハンドラ
  const handleClear = async () => {
    await clearJson();
    onToast('MCP JSON設定をクリアしました', 'success');
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">MCP JSON設定</h2>
      <p className="text-xs text-gray-500 mb-2">
        MCP用のJSONをここに入力してください。保存すると拡張機能内で利用できます。
      </p>
      <textarea
        className="w-full h-40 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono mb-2"
        value={jsonValue}
        onChange={handleChange}
        placeholder='{"example": 123}'
        disabled={!isMcpJsonLoaded}
      />
      {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
      <div className="flex gap-2">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          onClick={handleSave}
          disabled={!isMcpJsonLoaded}>
          保存
        </button>
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm"
          onClick={handleClear}
          disabled={!isMcpJsonLoaded || !jsonValue}>
          クリア
        </button>
      </div>
    </div>
  );
};

export default McpJsonSettings;
