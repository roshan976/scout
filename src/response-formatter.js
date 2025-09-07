const { getAllFiles } = require('./storage');

// Enhanced response formatting for different contexts
class ResponseFormatter {
  
  // Format response with enhanced visual elements and structure
  static formatEnhancedSlackResponse(queryResult, originalQuery, options = {}) {
    const {
      includeMetadata = true,
      includeQuickActions = true,
      includeTimestamp = false,
      maxSourcesShown = 5,
      responseStyle = 'professional' // professional, casual, technical
    } = options;

    if (!queryResult.success && !queryResult.mockResponse) {
      return this.formatErrorResponse(queryResult.error, originalQuery);
    }
    
    const result = queryResult.success ? queryResult : queryResult.mockResponse;
    const responseText = result.response;
    const isMock = result.mock || false;
    const sources = result.sources || [];
    const availableFiles = result.availableFiles || 0;
    
    // Format main response directly without header or question summary
    const formattedResponse = this.formatResponseBody(responseText, originalQuery, responseStyle);
    
    // Create enhanced source citations
    const sourcesSection = this.formatSourcesCitations(sources, availableFiles, maxSourcesShown, isMock);
    
    // Create action buttons section - disabled per user request
    const actionsSection = null;
    
    // Create metadata footer
    const metadataSection = includeMetadata ? this.createMetadataFooter(isMock, availableFiles, includeTimestamp) : null;
    
    // Build simplified Slack blocks structure without header
    const blocks = this.buildSlackBlocks({
      headerText: null,
      formattedResponse,
      sourcesSection,
      actionsSection,
      metadataSection
    });
    
    // Create fallback text for notifications
    const fallbackText = this.createFallbackText(null, originalQuery, responseText);
    
    return {
      text: fallbackText,
      blocks: blocks,
      response_type: 'in_channel', // Make responses visible to channel
      replace_original: false
    };
  }
  
  // Create styled header text
  static createHeaderText(style, isMock) {
    const baseHeader = '🤖 Scout Knowledge Assistant';
    
    if (isMock) {
      return `${baseHeader} (Demo Mode)`;
    }
    
    switch (style) {
      case 'casual':
        return '🤖 Hey! Scout here with your answer';
      case 'technical':
        return '🔍 Scout Technical Assistant';
      default:
        return baseHeader;
    }
  }
  
  // Enhanced response body formatting
  static formatResponseBody(responseText, originalQuery, style) {
    // Format response directly without query context
    let formattedText = responseText;
    
    // Add formatting improvements
    formattedText = this.enhanceTextFormatting(formattedText);
    
    return formattedText;
  }
  
  // Enhance text formatting with Slack markdown
  static enhanceTextFormatting(text) {
    // Convert bullet points to better formatting
    text = text.replace(/^• /gm, ':small_blue_diamond: ');
    text = text.replace(/^- /gm, ':small_orange_diamond: ');
    
    // Enhance headers (if any)
    text = text.replace(/^### (.*)/gm, '*$1*');
    text = text.replace(/^## (.*)/gm, '*$1*');
    text = text.replace(/^# (.*)/gm, '*$1*');
    
    // Add spacing around paragraphs for better readability
    text = text.replace(/\n\n/g, '\n\n');
    
    return text;
  }
  
  // Enhanced source citations with better formatting
  static formatSourcesCitations(sources, availableFiles, maxSourcesShown, isMock) {
    if (isMock) {
      return this.formatMockSources(availableFiles, maxSourcesShown);
    }
    
    if (!sources || sources.length === 0) {
      return {
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: '📚 *Sources:* Response based on general knowledge'
        }]
      };
    }
    
    const displaySources = sources.slice(0, maxSourcesShown);
    const hasMore = sources.length > maxSourcesShown;
    
    let sourceText = '📚 *Sources referenced:*\n';
    displaySources.forEach((source, index) => {
      sourceText += `:small_blue_diamond: ${source}\n`;
    });
    
    if (hasMore) {
      sourceText += `_...and ${sources.length - maxSourcesShown} more sources_`;
    }
    
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sourceText.trim()
      }
    };
  }
  
  // Format mock sources with available file information
  static formatMockSources(availableFiles, maxSourcesShown) {
    if (availableFiles === 0) {
      return {
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: '📁 *Knowledge Base:* No documents currently available'
        }]
      };
    }
    
    const files = getAllFiles();
    const fileList = Object.values(files).slice(0, maxSourcesShown);
    
    let sourceText = `📁 *Available Knowledge Base* (${availableFiles} documents):\n`;
    fileList.forEach(file => {
      sourceText += `:small_blue_diamond: *${file.originalName}*: ${file.description}\n`;
    });
    
    if (availableFiles > maxSourcesShown) {
      sourceText += `_...and ${availableFiles - maxSourcesShown} more documents_`;
    }
    
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sourceText.trim()
      }
    };
  }
  
  // Create action buttons for common follow-ups
  static createActionButtons(originalQuery, isMock) {
    // Buttons have been disabled per user request
    return null;
  }
  
  // Create enhanced metadata footer
  static createMetadataFooter(isMock, availableFiles, includeTimestamp) {
    let footerElements = [];
    
    if (isMock) {
      footerElements.push({
        type: 'mrkdwn',
        text: `💡 *Demo Mode* - Add OpenAI API keys for live Assistant integration with ${availableFiles} documents`
      });
    } else {
      footerElements.push({
        type: 'mrkdwn',
        text: '✅ *Live Response* - Powered by OpenAI Assistant with document search'
      });
    }
    
    if (includeTimestamp) {
      footerElements.push({
        type: 'mrkdwn',
        text: `🕐 ${new Date().toLocaleString()}`
      });
    }
    
    return {
      type: 'context',
      elements: footerElements
    };
  }
  
  // Build simplified Slack blocks structure
  static buildSlackBlocks({ headerText, formattedResponse, sourcesSection, actionsSection, metadataSection }) {
    const blocks = [];
    
    // Skip header block - removed per user request
    
    // Main response block
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: formattedResponse
      }
    });
    
    // Sources section (without divider for cleaner look)
    if (sourcesSection) {
      blocks.push(sourcesSection);
    }
    
    // Action buttons
    if (actionsSection) {
      blocks.push(actionsSection);
    }
    
    // Metadata footer
    if (metadataSection) {
      blocks.push(metadataSection);
    }
    
    return blocks;
  }
  
  // Create fallback text for notifications and accessibility
  static createFallbackText(headerText, originalQuery, responseText) {
    const shortResponse = responseText.length > 200 
      ? responseText.substring(0, 197) + '...' 
      : responseText;
    
    return shortResponse;
  }
  
  // Format error responses with helpful information
  static formatErrorResponse(error, originalQuery) {
    return {
      text: `🚨 Error processing query: "${originalQuery}"`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Scout Error',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Your question:* "${originalQuery}"\n\n❌ *Error:* ${error}\n\n💡 *Try:*\n:small_blue_diamond: Rephrasing your question\n:small_blue_diamond: Asking something more specific\n:small_blue_diamond: Checking if documents are uploaded`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '🔄 Try Again',
                emoji: true
              },
              style: 'primary',
              value: 'retry',
              action_id: 'retry_query'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📞 Get Help',
                emoji: true
              },
              value: 'help',
              action_id: 'get_help'
            }
          ]
        }
      ],
      response_type: 'ephemeral' // Only visible to user who asked
    };
  }
  
  // Quick response formatter for simple acknowledgments
  static formatQuickResponse(message, style = 'info') {
    const icons = {
      info: '💡',
      success: '✅', 
      warning: '⚠️',
      error: '❌'
    };
    
    return {
      text: `${icons[style]} ${message}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${icons[style]} ${message}`
          }
        }
      ],
      response_type: 'ephemeral'
    };
  }
  
  // Format help/usage information
  static formatHelpResponse() {
    return {
      text: '🤖 Scout Help - How to use Scout effectively',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🤖 Scout Help',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*How to ask Scout questions:*\n\n:small_blue_diamond: `scout what\'s our vacation policy?`\n:small_blue_diamond: `@scout how do I deploy to production?`\n:small_blue_diamond: `scout tell me about security guidelines`\n:small_blue_diamond: Direct message Scout for private questions'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Tips for better answers:*\n\n:small_blue_diamond: Be specific in your questions\n:small_blue_diamond: Use keywords from your documents\n:small_blue_diamond: Ask follow-up questions for clarification\n:small_blue_diamond: Check document uploads are current'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Scout searches through:*\n\n:small_blue_diamond: Company policies and procedures\n:small_blue_diamond: Technical documentation\n:small_blue_diamond: Team guidelines and best practices\n:small_blue_diamond: Process documentation'
          }
        }
      ]
    };
  }
}

module.exports = {
  ResponseFormatter
};