import React from 'react';
import ReactDOM from 'react-dom/client';

interface WindowOptions {
    title?: string;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
}

/**
 * Opens a React component in a new window
 */
export const openComponentInWindow = (
    Component: React.ComponentType<unknown>,
    props: Record<string, unknown>,
    options: WindowOptions = {}
): Window | null => {
    const {
        title = 'New Window',
        width = 600,
        height = 400,
        left,
        top
    } = options;

    // Calculate position (center by default)
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const calculatedLeft = left ?? Math.round((screenWidth - width) / 2);
    const calculatedTop = top ?? Math.round((screenHeight - height) / 2);

    // Open the new window
    const newWindow = window.open(
        '',
        '_blank',
        `width=${width},height=${height},left=${calculatedLeft},top=${calculatedTop}`
    );

    if (!newWindow) {
        console.error('Failed to open new window. It may have been blocked by a popup blocker.');
        return null;
    }

    // Set the window title
    newWindow.document.title = title;

    // Write the initial HTML with tailwind
    newWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
                         Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: #1f2937;
            color: #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `);

    newWindow.document.close();

    // Create a root for React to render into
    const rootElement = newWindow.document.getElementById('root');
    if (rootElement) {
        const root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(Component, props));

        // Handle window close to clean up React
        newWindow.addEventListener('beforeunload', () => {
            root.unmount();
        });
    }

    return newWindow;
};

/**
 * Opens a transaction data window with the given data
 */
export const openTransactionDataWindow = (data: string): Window | null => {
    try {
        console.log('Attempting to open transaction data window...');

        // Calculate position for top right corner
        const screenWidth = window.screen.width;
        const windowWidth = 800;
        const windowHeight = 600;
        const left = screenWidth - windowWidth - 20; // 20px margin from right edge
        const top = 20; // 20px from top

        // Many popup blockers allow popups in direct response to user action
        // Opening with 'about:blank' and then writing content is more likely to succeed
        const newWindow = window.open(
            'about:blank',
            '_blank',
            `width=${windowWidth},height=${windowHeight},left=${left},top=${top}`
        );

        if (!newWindow) {
            console.error('Failed to open transaction data window. It may have been blocked by a popup blocker.');
            alert('Transaction data window was blocked. Please allow popups for this site to view transaction details.');
            return null;
        }

        // Handle potential errors with data formatting
        let formattedData = data;
        try {
            // Try to format as JSON if it's valid JSON
            const parsedData = JSON.parse(data);
            formattedData = JSON.stringify(parsedData, null, 2);
        } catch {
            // Not JSON or malformed JSON, use as is
            console.log('Transaction data is not valid JSON, displaying as raw text');
        }

        // Set window title
        newWindow.document.title = 'Transaction Data';

        // Create an HTML document with styling
        newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Data</title>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            /* Basic reset and styling */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
                           Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              background-color: #1f2937;
              color: #e5e7eb;
              padding: 24px;
              line-height: 1.6;
            }
            
            h2 {
              color: white;
              margin-bottom: 16px;
              font-size: 24px;
              font-weight: 600;
            }
            
            .data-container {
              background-color: #374151;
              padding: 16px;
              border-radius: 8px;
              word-break: break-all;
              white-space: pre-wrap;
              overflow-y: auto;
              max-height: calc(100vh - 100px);
              font-family: monospace;
              font-size: 14px;
            }
            
            .toolbar {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 12px;
            }
            
            button {
              background-color: #4b5563;
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin-left: 8px;
            }
            
            button:hover {
              background-color: #6b7280;
            }

            .tooltip {
              position: relative;
              display: inline-block;
            }

            .tooltip-text {
              visibility: hidden;
              background-color: #333;
              color: #fff;
              text-align: center;
              border-radius: 4px;
              padding: 5px 10px;
              position: absolute;
              z-index: 1;
              bottom: 125%;
              left: 50%;
              transform: translateX(-50%);
              opacity: 0;
              transition: opacity 0.3s;
              white-space: nowrap;
            }

            .tooltip:hover .tooltip-text {
              visibility: visible;
              opacity: 1;
            }
            
            .notice {
              background-color: #374151;
              border-left: 4px solid #10b981;
              padding: 12px;
              margin-bottom: 16px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <h2>Transaction Data</h2>
          <div class="notice">
            This window displays the raw transaction data. Keep this window open while you approve the transaction in your wallet.
          </div>
          <div class="toolbar">
            <button id="copy-btn" class="tooltip">
              Copy to Clipboard
              <span class="tooltip-text" id="copy-tooltip">Copy to clipboard</span>
            </button>
            <button id="format-btn" class="tooltip">
              Toggle Format
              <span class="tooltip-text" id="format-tooltip">Toggle between raw and formatted view</span>
            </button>
          </div>
          <div class="data-container" id="data-container"></div>
          
          <script>
            // Store both raw and formatted data
            const rawData = ${JSON.stringify(escapeHtml(data))};
            let formattedData = ${JSON.stringify(escapeHtml(formattedData))};
            let isFormatted = true;
            
            // Function to safely set text content
            function setDataContent(isFormatted) {
              const dataContainer = document.getElementById('data-container');
              dataContainer.textContent = isFormatted ? formattedData : rawData;
            }
            
            // Initialize with formatted data
            setDataContent(true);
            
            // Add functionality to the buttons
            document.getElementById('copy-btn').addEventListener('click', function() {
              const dataContainer = document.getElementById('data-container');
              const text = dataContainer.textContent;
              const tooltip = document.getElementById('copy-tooltip');
              
              navigator.clipboard.writeText(text)
                .then(() => {
                  tooltip.textContent = 'Copied!';
                  setTimeout(() => {
                    tooltip.textContent = 'Copy to clipboard';
                  }, 2000);
                })
                .catch(err => {
                  console.error('Failed to copy: ', err);
                  tooltip.textContent = 'Copy failed';
                  setTimeout(() => {
                    tooltip.textContent = 'Copy to clipboard';
                  }, 2000);
                });
            });
            
            document.getElementById('format-btn').addEventListener('click', function() {
              const tooltip = document.getElementById('format-tooltip');
              isFormatted = !isFormatted;
              setDataContent(isFormatted);
              
              tooltip.textContent = isFormatted ? 'Switch to raw view' : 'Switch to formatted view';
              setTimeout(() => {
                tooltip.textContent = 'Toggle between raw and formatted view';
              }, 2000);
            });
            
            // Focus this window to make sure it's visible
            window.focus();
            
            // Handle errors gracefully
            window.onerror = function(message, source, lineno, colno, error) {
              console.error('Error in transaction data window:', message);
              return true; // Prevents the default browser error handling
            };
          </script>
        </body>
      </html>
    `);

        // Close the document to finish loading
        newWindow.document.close();

        // Try to focus the window
        try {
            newWindow.focus();
        } catch (focusErr) {
            console.warn('Could not focus transaction data window', focusErr);
        }

        console.log('Transaction data window successfully created');
        return newWindow;
    } catch (err) {
        console.error('Error opening transaction data window:', err);
        return null;
    }
};

// Helper function to escape HTML and prevent XSS
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
} 