const { config } = require('./config');
const { getAllFiles } = require('./storage');
const { ResponseFormatter } = require('./response-formatter');

// Import the getOpenAIClient function from openai.js
const { getOpenAIClient } = require('./openai');

function getClient() {
  try {
    return getOpenAIClient();
  } catch (error) {
    console.log('⚠️ OpenAI client initialization failed:', error.message);
    return null;
  }
}

// Process a query using OpenAI Assistant
async function processQuery(userQuery, userId = null, channelId = null) {
  console.log('🔍 Processing query:', userQuery);
  console.log('👤 User:', userId);
  console.log('📍 Channel:', channelId);
  
  // Debug configuration values
  console.log('🔍 Debug - OpenAI API Key:', config.openai.apiKey ? 'SET ✅' : 'MISSING ❌');
  console.log('🔍 Debug - Assistant ID:', config.openai.assistantId ? 'SET ✅' : 'MISSING ❌');
  console.log('🔍 Debug - API Key value:', config.openai.apiKey ? config.openai.apiKey.substring(0, 20) + '...' : 'null');
  console.log('🔍 Debug - Assistant ID value:', config.openai.assistantId || 'null');
  
  // Check if OpenAI is configured
  const client = getClient();
  if (!client) {
    console.log('⚠️ OpenAI not configured, returning mock response');
    return generateMockResponse(userQuery);
  }
  
  // Check if Assistant is configured
  if (!config.openai.assistantId || config.openai.assistantId === 'your_assistant_id_here') {
    console.log('⚠️ OpenAI Assistant not configured, returning mock response');
    console.log('⚠️ Assistant ID check failed:', config.openai.assistantId);
    return generateMockResponse(userQuery);
  }
  
  try {
    // Log Assistant configuration before running
    console.log('📊 Pre-query Assistant verification:');
    const assistantDetails = await client.beta.assistants.retrieve(config.openai.assistantId);
    console.log('   - Assistant Name:', assistantDetails.name);
    console.log('   - Tools enabled:', assistantDetails.tools.map(t => t.type).join(', '));
    console.log('   - Vector stores attached:', assistantDetails.tool_resources?.file_search?.vector_store_ids?.length || 0);
    if (assistantDetails.tool_resources?.file_search?.vector_store_ids) {
      console.log('   - Vector store IDs:', assistantDetails.tool_resources.file_search.vector_store_ids);
    }
    
    // Create a thread for this conversation
    console.log('🧵 Creating conversation thread...');
    const thread = await client.beta.threads.create();
    console.log('   - Thread ID:', thread.id);
    
    // Add the user's message to the thread
    console.log('💬 Adding user message to thread...');
    await client.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userQuery
    });
    console.log('   - Message added successfully');
    
    // Run the Assistant
    console.log('🤖 Running Assistant...');
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: config.openai.assistantId
    });
    console.log('   - Run ID:', run.id);
    console.log('   - Run Status:', run.status);
    
    // Wait for completion
    console.log('⏳ Waiting for Assistant response...');
    let runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
    let pollCount = 0;
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      pollCount++;
      console.log(`   - Poll ${pollCount}: Status = ${runStatus.status}`);
      if (runStatus.usage) {
        console.log(`   - Token usage so far:`, runStatus.usage);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
    }
    
    console.log('🔴 Assistant run completed:');
    console.log('   - Final status:', runStatus.status);
    console.log('   - Total polls:', pollCount);
    if (runStatus.usage) {
      console.log('   - Final token usage:', runStatus.usage);
    }
    if (runStatus.last_error) {
      console.log('   - Last error:', runStatus.last_error);
    }
    
    if (runStatus.status === 'completed') {
      // Get the Assistant's response
      console.log('✅ Getting Assistant response...');
      const messages = await client.beta.threads.messages.list(thread.id);
      console.log('   - Total messages in thread:', messages.data.length);
      
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      console.log('   - Assistant message found:', !!assistantMessage);
      
      if (assistantMessage && assistantMessage.content[0]) {
        const responseText = assistantMessage.content[0].text.value;
        console.log('🎯 Assistant response received:');
        console.log('   - Response length:', responseText.length, 'characters');
        console.log('   - Response preview:', responseText.substring(0, 200) + '...');
        
        // Check for file search annotations
        const annotations = assistantMessage.content[0].text.annotations || [];
        console.log('🔍 File search analysis:');
        console.log('   - Annotations found:', annotations.length);
        if (annotations.length > 0) {
          console.log('   - Annotation types:', annotations.map(a => a.type).join(', '));
          annotations.forEach((annotation, i) => {
            if (annotation.type === 'file_citation') {
              console.log(`   - Citation ${i + 1}: File ID ${annotation.file_citation.file_id}`);
            }
          });
        } else {
          console.log('   ⚠️ No file citations found - vector store may not be working');
        }
        
        const sources = extractSources(responseText);
        console.log('   - Extracted sources:', sources.length, sources);
        
        return {
          success: true,
          response: responseText,
          threadId: thread.id,
          runId: run.id,
          sources: sources,
          annotations: annotations,
          hasFileCitations: annotations.some(a => a.type === 'file_citation')
        };
      }
    }
    
    console.log('❌ Assistant run failed or incomplete:', runStatus.status);
    if (runStatus.last_error) {
      console.log('   - Error details:', runStatus.last_error);
    }
    if (runStatus.incomplete_details) {
      console.log('   - Incomplete details:', runStatus.incomplete_details);
    }
    return {
      success: false,
      error: `Assistant run failed with status: ${runStatus.status}`,
      runDetails: runStatus,
      mockResponse: generateMockResponse(userQuery)
    };
    
  } catch (error) {
    console.error('❌ Error processing query:', error.message);
    return {
      success: false,
      error: error.message,
      mockResponse: generateMockResponse(userQuery)
    };
  }
}

// Generate a mock response when OpenAI is not available
function generateMockResponse(query) {
  const files = getAllFiles();
  const fileCount = Object.keys(files).length;
  const fileList = Object.values(files).slice(0, 3); // Show first 3 files
  
  const mockResponses = [
    `I found relevant information about "${query}" in our company documents. Based on the uploaded files, here's what I can tell you:\n\n• Key insights from our documentation\n• Related processes and procedures\n• Contact information for follow-up\n\nThis response would normally be generated from ${fileCount} uploaded documents using OpenAI Assistant.`,
    
    `Great question about "${query}"! I searched through our knowledge base and found several relevant resources:\n\n• Documentation covering this topic\n• Best practices from our team\n• Step-by-step guidance\n\nOnce OpenAI integration is active, I'll provide specific citations and detailed answers from our ${fileCount} uploaded files.`,
    
    `I understand you're asking about "${query}". Here's what I found in our company resources:\n\n• Relevant policies and guidelines\n• Technical documentation\n• Team recommendations\n\nWith full OpenAI integration, I'll search through all ${fileCount} documents and provide cited responses.`
  ];
  
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  
  let sourcesText = '';
  if (fileList.length > 0) {
    sourcesText = `\n\n**Available Sources:**\n${fileList.map(file => `• ${file.originalName}: ${file.description}`).join('\n')}`;
  }
  
  return {
    success: true,
    response: randomResponse + sourcesText,
    mock: true,
    availableFiles: fileCount
  };
}

// Extract source citations from Assistant response
function extractSources(responseText) {
  // Look for patterns like "according to document.pdf" or "from file.docx"
  const sourcePatterns = [
    /according to ([^,.\n]+)/gi,
    /from ([^,.\n]+)/gi,
    /in ([^,.\n]+)/gi,
    /based on ([^,.\n]+)/gi
  ];
  
  const sources = [];
  sourcePatterns.forEach(pattern => {
    const matches = responseText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const source = match.replace(/^(according to|from|in|based on)\s+/i, '');
        if (source && !sources.includes(source)) {
          sources.push(source);
        }
      });
    }
  });
  
  return sources;
}

// Format response for Slack
function formatSlackResponse(queryResult, originalQuery) {
  if (!queryResult.success && !queryResult.mockResponse) {
    return {
      text: `🚨 Sorry, I encountered an error processing your query: "${originalQuery}"\n\nError: ${queryResult.error}\n\nPlease try again or contact support if the issue persists.`,
      blocks: null
    };
  }
  
  const result = queryResult.success ? queryResult : queryResult.mockResponse;
  const responseText = result.response;
  const isMock = result.mock || false;
  
  let headerText = '🤖 Scout Knowledge Assistant';
  if (isMock) {
    headerText += ' (Demo Mode)';
  }
  
  let footerText = '';
  if (result.sources && result.sources.length > 0) {
    footerText = `\n\n📚 *Sources:* ${result.sources.join(', ')}`;
  } else if (result.availableFiles) {
    footerText = `\n\n📁 *Available Knowledge Base:* ${result.availableFiles} documents`;
  }
  
  if (isMock) {
    footerText += `\n\n💡 *Note:* This is a demo response. Add OpenAI API keys for live Assistant integration.`;
  }
  
  return {
    text: `${headerText}\n\n${responseText}${footerText}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: headerText
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: responseText
        }
      },
      ...(footerText ? [{
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: footerText.trim()
        }]
      }] : [])
    ]
  };
}

// Enhanced Slack response formatter with better styling
function formatEnhancedSlackResponse(queryResult, originalQuery, options = {}) {
  return ResponseFormatter.formatEnhancedSlackResponse(queryResult, originalQuery, options);
}

// Format help response
function formatHelpResponse() {
  return ResponseFormatter.formatHelpResponse();
}

// Format quick responses
function formatQuickResponse(message, style = 'info') {
  return ResponseFormatter.formatQuickResponse(message, style);
}

module.exports = {
  processQuery,
  formatSlackResponse,
  formatEnhancedSlackResponse,
  formatHelpResponse,
  formatQuickResponse,
  generateMockResponse
};