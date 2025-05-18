import { useState, useEffect } from 'react';
import { githubTokenStorage, githubApiDomainStorage } from '@extension/storage';

interface TokenSetupPromptProps {
  onComplete: () => void;
}

const TokenSetupPrompt: React.FC<TokenSetupPromptProps> = ({ onComplete }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiDomain, setApiDomain] = useState('');

  // Load API domain from storage on mount
  useEffect(() => {
    const loadApiDomain = async () => {
      try {
        const domain = await githubApiDomainStorage.get();
        if (domain) {
          setApiDomain(domain);
        }
      } catch (err) {
        console.error('Error loading API domain:', err);
      }
    };

    loadApiDomain();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Please enter a valid GitHub token');
      return;
    }

    try {
      setIsLoading(true);

      // Verify the token works by making a test API call
      const response = await fetch(`${apiDomain}/user`, {
        headers: {
          Authorization: `token ${token}`,
        },
      });

      if (response.ok) {
        // Save the token only if it's verified
        await githubTokenStorage.set(token);
        onComplete();
      } else {
        setError(`Invalid token: ${response.statusText}`);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Token verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen p-6 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">GitHub Token Setup</h2>
        <p className="text-sm mb-4">
          To use PR Checklistify, you need to provide a GitHub Personal Access Token with 'repo' scope permissions.
        </p>

        <div className="mb-4">
          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=PR+Checklistify+Extension"
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-700 text-sm">
            Create a new token on GitHub →
          </a>
        </div>

        {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-md ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}>
              {isLoading ? 'Verifying...' : 'Save Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TokenSetupPrompt;
