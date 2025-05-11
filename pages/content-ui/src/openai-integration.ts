import { openaiApiKeyStorage } from '@extension/storage';
import { createOpenAIClient, type PRAnalysisResult } from '@extension/shared';

// Button ID constant to avoid duplication
const BUTTON_ID = 'prchecklistify-generate-btn';

/**
 * Initialize OpenAI integration for PR pages
 */
export const initOpenAIIntegration = async (): Promise<void> => {
  try {
    // Check if we're on a PR page
    const isPRPage = window.location.href.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/);
    if (!isPRPage) return;

    // Check if button already exists to avoid duplicates
    if (document.getElementById(BUTTON_ID)) return;

    // Check if OpenAI API key is set
    const apiKey = await openaiApiKeyStorage.get();
    if (!apiKey) {
      console.log('OpenAI API key not set, skipping PR checklist button injection');
      return;
    }

    // Find insertion point - the description area in the PR page
    const insertionPoint = findInsertionPoint();
    if (!insertionPoint) {
      console.log('Could not find insertion point for PR checklist button');
      return;
    }

    // Create and inject the button
    injectGenerateButton(insertionPoint);
  } catch (error) {
    console.error('Error initializing OpenAI integration:', error);
  }
};

/**
 * Find the insertion point in the GitHub PR page
 */
const findInsertionPoint = (): HTMLElement | null => {
  // Try to find the PR description area
  const prTimelineContainer = document.querySelector('.js-timeline-container');

  if (!prTimelineContainer) return null;

  // Look for the first PR comment container or description area
  return prTimelineContainer.querySelector('.js-comment-container') as HTMLElement;
};

/**
 * Create and inject the "Generate PR Checklist" button
 */
const injectGenerateButton = (insertionPoint: HTMLElement): void => {
  // Create button container
  const container = document.createElement('div');
  container.className = 'mb-3 d-flex flex-items-center';
  container.style.marginTop = '10px';

  // Create button
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.className = 'btn btn-sm';
  button.textContent = 'Generate PR Checklist';
  button.setAttribute('aria-label', 'Generate an AI-powered PR checklist');
  button.style.marginRight = '8px';

  // Create loading indicator (hidden by default)
  const loadingIndicator = document.createElement('span');
  loadingIndicator.className = 'anim-rotate';
  loadingIndicator.style.display = 'none';
  loadingIndicator.innerHTML =
    '<svg class="octicon octicon-sync" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z"></path></svg>';

  // Add event listener to button
  button.addEventListener('click', async () => {
    try {
      // Show loading state
      button.disabled = true;
      loadingIndicator.style.display = 'inline-block';
      button.textContent = 'Generating...';

      // Get PR data
      const prData = await fetchPRData();
      if (!prData) {
        throw new Error('Failed to fetch PR data');
      }

      // Generate PR checklist using OpenAI
      const openaiClient = await createOpenAIClient();
      if (!openaiClient) {
        throw new Error('Failed to create OpenAI client');
      }

      const result = await openaiClient.analyzePR(prData);

      // Insert the result into the PR description
      insertPRChecklist(result);
    } catch (error) {
      console.error('Error generating PR checklist:', error);
      alert('Failed to generate PR checklist: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      // Reset button state
      button.disabled = false;
      loadingIndicator.style.display = 'none';
      button.textContent = 'Generate PR Checklist';
    }
  });

  // Add elements to container and inject
  container.appendChild(button);
  container.appendChild(loadingIndicator);

  // Insert at the beginning of the insertion point
  insertionPoint.prepend(container);
};

/**
 * Fetch PR data from GitHub API
 */
const fetchPRData = async (): Promise<any> => {
  try {
    // Extract owner, repo, and PR number from URL
    const match = window.location.href.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return null;

    const [, owner, repo, prNumber] = match;

    // Get PR data
    const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`);
    if (!prResponse.ok) {
      throw new Error(`Failed to fetch PR data: ${prResponse.statusText}`);
    }
    const prData = await prResponse.json();

    // Get PR files
    const filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`);
    if (!filesResponse.ok) {
      throw new Error(`Failed to fetch PR files: ${filesResponse.statusText}`);
    }
    const filesData = await filesResponse.json();

    // Format the data for OpenAI
    return {
      title: prData.title,
      description: prData.body || '',
      files: filesData.map((file: any) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
      })),
    };
  } catch (error) {
    console.error('Error fetching PR data:', error);
    throw error;
  }
};

/**
 * Insert the PR checklist into the PR description
 */
const insertPRChecklist = (result: PRAnalysisResult): void => {
  try {
    // Create PR checklist markdown
    const markdown = formatPRChecklistMarkdown(result);

    // Find the edit button for the PR description
    const editButton = document.querySelector('[aria-label="Edit the description of this Pull Request"]');
    if (editButton && editButton instanceof HTMLElement) {
      // Click the edit button
      editButton.click();

      // Wait for the editor to appear
      setTimeout(() => {
        // Find the textarea
        const textarea = document.querySelector('textarea#pull_request_body');
        if (textarea && textarea instanceof HTMLTextAreaElement) {
          // Add the checklist to the current content
          textarea.value = textarea.value + '\n\n' + markdown;

          // Submit the form
          const submitButton = document.querySelector('button.js-comment-update-button');
          if (submitButton && submitButton instanceof HTMLElement) {
            submitButton.click();
          }
        }
      }, 500);
    } else {
      // If we can't find the edit button, create a modal to display the result
      createResultModal(result);
    }
  } catch (error) {
    console.error('Error inserting PR checklist:', error);
    createResultModal(result);
  }
};

/**
 * Format PR checklist result as markdown
 */
const formatPRChecklistMarkdown = (result: PRAnalysisResult): string => {
  let markdown = '## 🤖 AI-Generated PR Checklist\n\n';

  // Add summary
  markdown += '### PR Summary\n\n';
  markdown += `**Background:** ${result.summary.background}\n\n`;
  markdown += `**Problem:** ${result.summary.problem}\n\n`;
  markdown += `**Solution:** ${result.summary.solution}\n\n`;
  markdown += `**Implementation:** ${result.summary.implementation}\n\n`;

  // Add file checklists
  markdown += '### Checklist by File\n\n';

  result.fileAnalysis.forEach(fileChecklist => {
    markdown += `#### ${fileChecklist.filename}\n\n`;

    fileChecklist.fileAnalysis.forEach(item => {
      markdown += `- [ ] ${item.description}\n`;
    });

    markdown += '\n';
  });

  return markdown;
};

/**
 * Create a modal to display the result if we can't edit the PR description
 */
const createResultModal = (result: PRAnalysisResult): void => {
  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'position-fixed top-0 left-0 right-0 bottom-0 d-flex flex-items-center flex-justify-center';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.zIndex = '1000';

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'Box Box--overlay d-flex flex-column';
  modalContent.style.width = '80%';
  modalContent.style.maxWidth = '800px';
  modalContent.style.maxHeight = '80vh';
  modalContent.style.overflow = 'auto';

  // Create modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'Box-header';

  const title = document.createElement('h3');
  title.className = 'Box-title';
  title.textContent = 'AI-Generated PR Checklist';

  const closeButton = document.createElement('button');
  closeButton.className = 'Box-btn-octicon btn-octicon float-right';
  closeButton.innerHTML =
    '<svg class="octicon octicon-x" viewBox="0 0 12 16" width="12" height="16"><path fill-rule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z"></path></svg>';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modalHeader.appendChild(title);
  modalHeader.appendChild(closeButton);

  // Create modal body
  const modalBody = document.createElement('div');
  modalBody.className = 'Box-body overflow-auto';

  // Create markdown content
  const markdown = document.createElement('div');
  markdown.className = 'markdown-body';
  markdown.style.padding = '16px';

  // Set markdown content
  const formattedMarkdown = formatPRChecklistMarkdown(result);
  markdown.innerHTML = convertMarkdownToHTML(formattedMarkdown);

  // Create copy button
  const copyButton = document.createElement('button');
  copyButton.className = 'btn btn-sm';
  copyButton.textContent = 'Copy to Clipboard';
  copyButton.style.marginTop = '16px';
  copyButton.addEventListener('click', () => {
    navigator.clipboard
      .writeText(formattedMarkdown)
      .then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy to Clipboard';
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  });

  modalBody.appendChild(markdown);
  modalBody.appendChild(copyButton);

  // Assemble modal
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);

  // Add modal to body
  document.body.appendChild(modal);
};

/**
 * Convert markdown to HTML (simple version)
 */
const convertMarkdownToHTML = (markdown: string): string => {
  // This is a very basic converter that handles only the most common markdown elements
  // For a real implementation, use a proper markdown library
  let html = markdown
    // Headers
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/#### (.*)/g, '<h4>$1</h4>')
    .replace(/## (.*)/g, '<h2>$1</h2>')

    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Checkboxes
    .replace(
      /- \[ \] (.*)/g,
      '<div class="form-checkbox"><label><input type="checkbox" disabled> <span>$1</span></label></div>',
    )
    .replace(
      /- \[x\] (.*)/g,
      '<div class="form-checkbox"><label><input type="checkbox" checked disabled> <span>$1</span></label></div>',
    )

    // Lists
    .replace(/- (.*)/g, '<li>$1</li>')

    // Paragraphs and line breaks
    .replace(/\n\n/g, '</p><p>');

  // Wrap in paragraph tags
  html = '<p>' + html + '</p>';

  // Fix lists
  html = html.replace(/<li>.*?<\/li>/g, match => {
    return '<ul>' + match + '</ul>';
  });

  return html;
};

export default initOpenAIIntegration;
