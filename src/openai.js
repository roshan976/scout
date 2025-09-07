const OpenAI = require('openai');
const { config } = require('./config');
const { getAllFiles } = require('./storage');

// Initialize OpenAI client lazily
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = config.openai.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Create OpenAI Assistant with file search enabled
async function createAssistant() {
  try {
    const client = getOpenAIClient();
    const assistant = await client.beta.assistants.create({
      name: "Scout",
      instructions: "You are Scout, an internal knowledge assistant for Arrow. You help employees access company information by searching through uploaded documents and providing accurate, cited answers. Always cite your sources when referencing specific documents.",
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      temperature: 0.1,
      tool_resources: {
        file_search: {
          vector_stores: []
        }
      }
    });

    console.log('✅ Scout Assistant created successfully');
    console.log('Assistant ID:', assistant.id);
    console.log('Instructions:', assistant.instructions);
    console.log('Tools:', assistant.tools.map(t => t.type).join(', '));
    
    return assistant;
  } catch (error) {
    console.error('❌ Error creating Assistant:', error.message);
    throw error;
  }
}

// Get existing Assistant by ID
async function getAssistant(assistantId) {
  try {
    const client = getOpenAIClient();
    const assistant = await client.beta.assistants.retrieve(assistantId);
    return assistant;
  } catch (error) {
    console.error('❌ Error retrieving Assistant:', error.message);
    throw error;
  }
}

// Update Assistant instructions with file descriptions
async function updateAssistantInstructions(assistantId) {
  try {
    const files = getAllFiles();
    const fileList = Object.values(files);
    
    if (fileList.length === 0) {
      console.log('ℹ️  No files found, using basic instructions');
      return await updateAssistantWithInstructions(assistantId, 
        "You are Scout, an internal knowledge assistant for Arrow. You help employees access company information. Currently no documents are available."
      );
    }

    // Build dynamic instructions with file descriptions
    const fileDescriptions = fileList.map(file => 
      `- ${file.originalName}: ${file.description}`
    ).join('\n');

    const instructions = `You are Scout, an internal knowledge assistant for Arrow. You help employees access company information by searching through uploaded documents and providing accurate, cited answers.

You have access to these company files:
${fileDescriptions}

When answering questions:
1. Search through the most relevant files based on the question
2. Provide accurate answers based on the document content
3. Always cite your sources with specific file references
4. If information isn't found in the documents, clearly state this
5. Be helpful and professional in your responses`;

    return await updateAssistantWithInstructions(assistantId, instructions);
  } catch (error) {
    console.error('❌ Error updating Assistant instructions:', error.message);
    throw error;
  }
}

// Helper function to update instructions
async function updateAssistantWithInstructions(assistantId, instructions) {
  const client = getOpenAIClient();
  const assistant = await client.beta.assistants.update(assistantId, {
    instructions: instructions
  });
  
  console.log('✅ Assistant instructions updated');
  console.log('File count in instructions:', (instructions.match(/- \w/g) || []).length);
  
  return assistant;
}

// Upload file to OpenAI for Assistant
async function uploadFileToOpenAI(filePath, filename) {
  try {
    const client = getOpenAIClient();
    const file = await client.files.create({
      file: require('fs').createReadStream(filePath),
      purpose: 'assistants'
    });
    
    console.log('✅ File uploaded to OpenAI:', filename);
    console.log('OpenAI File ID:', file.id);
    
    return file;
  } catch (error) {
    console.error('❌ Error uploading file to OpenAI:', error.message);
    throw error;
  }
}

// Create vector store and attach files
async function createVectorStoreWithFiles(fileIds, storeName = "Scout Knowledge Base") {
  try {
    const client = getOpenAIClient();
    
    console.log('🏗️ Creating vector store with name:', storeName);
    console.log('📁 Files to attach:', fileIds.length, 'files:', fileIds);
    
    // Create vector store
    const vectorStore = await client.vectorStores.create({
      name: storeName
    });
    console.log('✅ Vector store created successfully');
    console.log('   - Vector Store ID:', vectorStore.id);
    console.log('   - Vector Store Name:', vectorStore.name);
    console.log('   - Created at:', new Date(vectorStore.created_at * 1000).toISOString());
    
    // Add files to vector store one by one (more reliable than batch)
    if (fileIds.length > 0) {
      console.log('🔗 Attaching files to vector store...');
      let successCount = 0;
      let failCount = 0;
      
      for (const fileId of fileIds) {
        try {
          console.log(`   📄 Attaching file ${fileId} to vector store...`);
          const vectorStoreFile = await client.vectorStores.files.create(vectorStore.id, {
            file_id: fileId
          });
          console.log(`   ✅ File ${fileId} attached successfully`);
          console.log(`      - Vector Store File ID: ${vectorStoreFile.id}`);
          console.log(`      - Status: ${vectorStoreFile.status}`);
          successCount++;
        } catch (fileError) {
          console.error(`   ❌ Failed to attach file ${fileId}:`, fileError.message);
          console.error(`      Error details:`, fileError);
          failCount++;
        }
      }
      
      console.log('📊 Vector store file attachment summary:');
      console.log(`   - Successfully attached: ${successCount} files`);
      console.log(`   - Failed to attach: ${failCount} files`);
      console.log(`   - Total processed: ${fileIds.length} files`);
    }
    
    // Verify vector store status
    try {
      const verifiedStore = await client.vectorStores.retrieve(vectorStore.id);
      console.log('🔍 Vector store verification:');
      console.log('   - Status:', verifiedStore.status);
      console.log('   - File counts:', verifiedStore.file_counts);
      console.log('   - Usage bytes:', verifiedStore.usage_bytes);
    } catch (verifyError) {
      console.error('⚠️ Could not verify vector store:', verifyError.message);
    }
    
    return vectorStore;
  } catch (error) {
    console.error('❌ Error creating vector store:', error.message);
    console.error('Full error details:', error);
    throw error;
  }
}

// Attach vector store to Assistant
async function attachVectorStoreToAssistant(assistantId, vectorStoreId) {
  try {
    const client = getOpenAIClient();
    
    console.log('🔗 Attaching vector store to Assistant...');
    console.log('   - Assistant ID:', assistantId);
    console.log('   - Vector Store ID:', vectorStoreId);
    
    // Get current Assistant state before update
    const currentAssistant = await client.beta.assistants.retrieve(assistantId);
    console.log('📋 Current Assistant configuration:');
    console.log('   - Name:', currentAssistant.name);
    console.log('   - Tools:', currentAssistant.tools.map(t => t.type).join(', '));
    console.log('   - Current vector stores:', currentAssistant.tool_resources?.file_search?.vector_store_ids || []);
    
    const assistant = await client.beta.assistants.update(assistantId, {
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStoreId]
        }
      }
    });
    
    console.log('✅ Vector store attached to Assistant successfully');
    console.log('📋 Updated Assistant configuration:');
    console.log('   - Name:', assistant.name);
    console.log('   - Tools:', assistant.tools.map(t => t.type).join(', '));
    console.log('   - Attached vector stores:', assistant.tool_resources?.file_search?.vector_store_ids || []);
    
    return assistant;
  } catch (error) {
    console.error('❌ Error attaching vector store to Assistant:', error.message);
    console.error('Full error details:', error);
    throw error;
  }
}

// Get vector store details for debugging
async function getVectorStoreDetails(vectorStoreId) {
  try {
    const client = getOpenAIClient();
    const vectorStore = await client.vectorStores.retrieve(vectorStoreId);
    const files = await client.vectorStores.files.list(vectorStoreId);
    
    console.log('🔍 Vector Store Details:');
    console.log('   - ID:', vectorStore.id);
    console.log('   - Name:', vectorStore.name);
    console.log('   - Status:', vectorStore.status);
    console.log('   - File counts:', vectorStore.file_counts);
    console.log('   - Usage bytes:', vectorStore.usage_bytes);
    console.log('   - Files in store:', files.data.length);
    
    if (files.data.length > 0) {
      console.log('📄 Files in vector store:');
      files.data.forEach((file, index) => {
        console.log(`   ${index + 1}. File ID: ${file.id}, Status: ${file.status}`);
      });
    }
    
    return { vectorStore, files: files.data };
  } catch (error) {
    console.error('❌ Error getting vector store details:', error.message);
    throw error;
  }
}

module.exports = {
  getOpenAIClient,
  createAssistant,
  getAssistant,
  updateAssistantInstructions,
  uploadFileToOpenAI,
  createVectorStoreWithFiles,
  attachVectorStoreToAssistant,
  getVectorStoreDetails
};