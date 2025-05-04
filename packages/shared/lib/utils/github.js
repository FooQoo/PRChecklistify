export const GitHubUtils = {
  /**
   * Extract PR information from GitHub URL
   * Format: https://github.com/{owner}/{repo}/pull/{prId}
   */
  extractPRInfoFromURL(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname !== 'github.com') {
        return null;
      }

      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length < 4 || pathParts[2] !== 'pull') {
        return null;
      }

      const owner = pathParts[0];
      const repo = pathParts[1];
      const prNumber = pathParts[3];

      return {
        owner,
        repo,
        prNumber,
        // Generate a unique ID using repository name and PR number
        uniqueId: `${owner}/${repo}#${prNumber}`,
      };
    } catch (error) {
      console.error('Error parsing GitHub URL:', error);
      return null;
    }
  },

  /**
   * Check if the current page is a GitHub PR page
   */
  isGitHubPRPage() {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const url = window.location.href;
      return this.extractPRInfoFromURL(url) !== null;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get PR info from the current page URL
   */
  getCurrentPRInfo() {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const url = window.location.href;
      return this.extractPRInfoFromURL(url);
    } catch (error) {
      return null;
    }
  },

  /**
   * Generate a unique ID for a PR using repository name and PR number
   */
  generatePRUniqueId(owner, repo, prNumber) {
    return `${owner}/${repo}#${prNumber}`;
  },
};

export default GitHubUtils;
