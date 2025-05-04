import { createRoot } from 'react-dom/client';
import App from '@src/App';
import initOpenAIIntegration from '@src/openai-integration';
// @ts-expect-error Because file doesn't exist before build
import tailwindcssOutput from '../dist/tailwind-output.css?inline';

// Initialize OpenAI integration for GitHub PR pages
const initGitHubPRFeatures = async () => {
  try {
    // Initialize OpenAI integration (for the "Generate PR Checklist" button)
    await initOpenAIIntegration();

    // Re-run on navigation changes (for single-page apps like GitHub)
    const observer = new MutationObserver(async mutations => {
      // Check if we need to reinitialize (i.e., navigated to a new PR page)
      const shouldReinit = mutations.some(mutation => mutation.type === 'childList' && mutation.addedNodes.length > 0);

      if (shouldReinit) {
        await initOpenAIIntegration();
      }
    });

    // Observe changes to the main content area
    const targetNode = document.body;
    observer.observe(targetNode, { childList: true, subtree: true });

    // Also reinitialize on URL changes (for SPAs)
    let lastUrl = window.location.href;
    setInterval(() => {
      if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        initOpenAIIntegration();
      }
    }, 1000);
  } catch (error) {
    console.error('Error initializing GitHub PR features:', error);
  }
};

// Initialize the GitHub PR features
initGitHubPRFeatures();

// Continue with React app initialization
const root = document.createElement('div');
root.id = 'chrome-extension-boilerplate-react-vite-content-view-root';

document.body.append(root);

const rootIntoShadow = document.createElement('div');
rootIntoShadow.id = 'shadow-root';

const shadowRoot = root.attachShadow({ mode: 'open' });

if (navigator.userAgent.includes('Firefox')) {
  /**
   * In the firefox environment, adoptedStyleSheets cannot be used due to the bug
   * @url https://bugzilla.mozilla.org/show_bug.cgi?id=1770592
   *
   * Injecting styles into the document, this may cause style conflicts with the host page
   */
  const styleElement = document.createElement('style');
  styleElement.innerHTML = tailwindcssOutput;
  shadowRoot.appendChild(styleElement);
} else {
  /** Inject styles into shadow dom */
  const globalStyleSheet = new CSSStyleSheet();
  globalStyleSheet.replaceSync(tailwindcssOutput);
  shadowRoot.adoptedStyleSheets = [globalStyleSheet];
}

shadowRoot.appendChild(rootIntoShadow);
createRoot(rootIntoShadow).render(<App />);
