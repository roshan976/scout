const express = require('express');
const multer = require('multer');
const path = require('path');
const { saveFileMetadata, getAllFiles, deleteFileMetadata } = require('./storage');
const { uploadFileToOpenAI, updateAssistantInstructions } = require('./openai');
const { config } = require('./config');
const { processQuery, formatSlackResponse, formatEnhancedSlackResponse } = require('./query-handler');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp prefix
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.csv', '.txt', '.docx'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Query test endpoint for development
app.post('/query', async (req, res) => {
  try {
    const { query, user = 'test_user', channel = 'test_channel' } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Query is required',
        example: '{"query": "What is our vacation policy?"}'
      });
    }
    
    console.log('🔍 API Query received:', query);
    
    // Process the query
    const queryResult = await processQuery(query, user, channel);
    
    // Format for Slack (basic and enhanced versions)
    const slackResponse = formatSlackResponse(queryResult, query);
    const enhancedSlackResponse = formatEnhancedSlackResponse(queryResult, query, {
      responseStyle: 'professional',
      includeQuickActions: true,
      includeTimestamp: true
    });
    
    // Return both raw and formatted results
    res.json({
      query: query,
      raw: queryResult,
      slack: slackResponse,
      slackEnhanced: enhancedSlackResponse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error processing API query:', error);
    res.status(500).json({ 
      error: 'Query processing failed', 
      details: error.message 
    });
  }
});

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.body.description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Save metadata to JSON file first
    const metadataSaved = saveFileMetadata(
      req.file.filename,
      req.file.originalname,
      req.body.description
    );

    if (!metadataSaved) {
      console.warn('Failed to save metadata for file:', req.file.filename);
      return res.status(500).json({ error: 'Failed to save file metadata' });
    }

    let openaiResponse = null;
    let assistantUpdated = false;

    // Upload to OpenAI if API key is configured
    if (config.openai.apiKey && config.openai.apiKey !== 'your_openai_api_key_here') {
      try {
        console.log(`📤 Uploading ${req.file.originalname} to OpenAI...`);
        
        // Upload file to OpenAI
        const filePath = path.join('uploads', req.file.filename);
        const openaiFile = await uploadFileToOpenAI(filePath, req.file.originalname);
        
        // Update Assistant instructions with new file descriptions  
        if (config.openai.assistantId && config.openai.assistantId !== 'your_assistant_id_here') {
          await updateAssistantInstructions(config.openai.assistantId);
          assistantUpdated = true;
          console.log('✅ Assistant instructions updated');
        }
        
        openaiResponse = {
          fileId: openaiFile.id,
          assistantUpdated: assistantUpdated
        };
        
        console.log('✅ File uploaded to OpenAI and Assistant updated');
        
      } catch (error) {
        console.error('❌ OpenAI integration failed:', error.message);
        console.log('💡 File saved locally, but OpenAI integration skipped');
        openaiResponse = { error: error.message };
      }
    } else {
      console.log('⏭️  OpenAI API key not configured, skipping OpenAI upload');
    }

    // File uploaded successfully
    const response = {
      message: `File "${req.file.originalname}" uploaded successfully`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      description: req.body.description,
      size: req.file.size,
      openai: openaiResponse
    };

    res.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Get all files endpoint
app.get('/files', (req, res) => {
  try {
    const files = getAllFiles();
    const fileList = Object.values(files).map(file => ({
      filename: file.filename,
      originalName: file.originalName,
      description: file.description,
      uploadDate: file.uploadDate,
      size: getFileSize(file.filename)
    })).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    res.json({
      success: true,
      files: fileList,
      count: fileList.length
    });
  } catch (error) {
    console.error('❌ Error getting files:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get files',
      details: error.message 
    });
  }
});

// Delete file endpoint
app.delete('/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Check if file exists in metadata
    const files = getAllFiles();
    if (!files[filename]) {
      return res.status(404).json({ 
        success: false, 
        error: 'File not found' 
      });
    }
    
    // Delete physical file
    const filePath = path.join('uploads', filename);
    const fs = require('fs');
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
    
    // Delete metadata
    const metadataDeleted = deleteFileMetadata(filename);
    
    if (metadataDeleted) {
      // Update OpenAI Assistant instructions if configured
      if (config.openai.apiKey && config.openai.assistantId && 
          config.openai.apiKey !== 'your_openai_api_key_here' && 
          config.openai.assistantId !== 'your_assistant_id_here') {
        try {
          await updateAssistantInstructions(config.openai.assistantId);
          console.log('✅ OpenAI Assistant instructions updated after file deletion');
        } catch (error) {
          console.error('❌ Failed to update Assistant instructions:', error.message);
        }
      }
      
      res.json({ 
        success: true, 
        message: `File "${files[filename].originalName}" deleted successfully`,
        filename: filename 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete file metadata' 
      });
    }
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete file',
      details: error.message 
    });
  }
});

// Helper function to get file size
function getFileSize(filename) {
  try {
    const filePath = path.join('uploads', filename);
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.size;
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

// Handle multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: 'Server error: ' + error.message });
});

// Ensure required directories exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}
if (!fs.existsSync('data')) {
  fs.mkdirSync('data', { recursive: true });
}

// Start server
app.listen(PORT, async () => {
  console.log(`Scout server running on port ${PORT}`);
  console.log('✅ Required directories verified');
  console.log(`📁 Uploads: uploads/`);
  console.log(`📊 Data: data/`);
  console.log(`🌐 Web interface: http://localhost:${PORT}`);
  
  // Debug: Log Slack environment variables (masked for security)
  console.log('🔍 Slack Environment Check:');
  console.log('   SLACK_APP_TOKEN:', config.slack.appToken ? 'SET ✅' : 'MISSING ❌');
  console.log('   SLACK_BOT_TOKEN:', config.slack.botToken ? 'SET ✅' : 'MISSING ❌');
  console.log('   SLACK_SIGNING_SECRET:', config.slack.signingSecret ? 'SET ✅' : 'MISSING ❌');
  
  // Debug token lengths and check for invalid characters
  if (config.slack.appToken) {
    console.log('   APP_TOKEN length:', config.slack.appToken.length, 'starts with:', config.slack.appToken.substring(0, 10));
  }
  if (config.slack.botToken) {
    console.log('   BOT_TOKEN length:', config.slack.botToken.length, 'starts with:', config.slack.botToken.substring(0, 10));
  }
  if (config.slack.signingSecret) {
    console.log('   SIGNING_SECRET length:', config.slack.signingSecret.length);
  }
  
  // Debug OpenAI configuration
  console.log('🔍 OpenAI Environment Check:');
  console.log('   OPENAI_API_KEY:', config.openai.apiKey ? 'SET ✅' : 'MISSING ❌');
  console.log('   OPENAI_ASSISTANT_ID:', config.openai.assistantId ? 'SET ✅' : 'MISSING ❌');
  if (config.openai.apiKey) {
    console.log('   API_KEY starts with:', config.openai.apiKey.substring(0, 10));
  }
  if (config.openai.assistantId) {
    console.log('   ASSISTANT_ID:', config.openai.assistantId);
  }
  
  // Start Slack bot if tokens are available
  if (config.slack.appToken && config.slack.botToken && config.slack.signingSecret) {
    try {
      const { startSlackBot } = require('./slack');
      await startSlackBot();
      console.log('🤖 Slack bot started successfully!');
    } catch (error) {
      console.error('❌ Failed to start Slack bot:', error.message);
      console.log('💡 Scout web interface will work, but Slack integration is disabled');
    }
  } else {
    console.log('⏭️  Slack tokens not configured, running in demo mode');
    console.log('💡 Upload documents via web interface and use the Test Query tab');
  }
});