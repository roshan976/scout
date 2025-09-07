const fs = require('fs');
const path = require('path');

const METADATA_FILE = 'data/files.json';

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = 'data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load existing metadata from JSON file
function loadMetadata() {
  ensureDataDirectory();
  
  if (!fs.existsSync(METADATA_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(METADATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading metadata:', error.message);
    return {};
  }
}

// Save metadata to JSON file
function saveMetadata(metadata) {
  ensureDataDirectory();
  
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving metadata:', error.message);
    return false;
  }
}

// Save file metadata
function saveFileMetadata(filename, originalName, description) {
  const metadata = loadMetadata();
  
  metadata[filename] = {
    originalName: originalName,
    description: description,
    uploadDate: new Date().toISOString(),
    filename: filename
  };

  return saveMetadata(metadata);
}

// Get metadata for a specific file
function getFileMetadata(filename) {
  const metadata = loadMetadata();
  return metadata[filename] || null;
}

// Get all files metadata
function getAllFiles() {
  return loadMetadata();
}

// Delete file metadata
function deleteFileMetadata(filename) {
  const metadata = loadMetadata();
  
  if (metadata[filename]) {
    delete metadata[filename];
    return saveMetadata(metadata);
  }
  
  return false;
}

// Get files by description search
function searchFiles(searchTerm) {
  const metadata = loadMetadata();
  const results = {};
  
  for (const [filename, data] of Object.entries(metadata)) {
    if (data.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.originalName.toLowerCase().includes(searchTerm.toLowerCase())) {
      results[filename] = data;
    }
  }
  
  return results;
}

module.exports = {
  saveFileMetadata,
  getFileMetadata,
  getAllFiles,
  deleteFileMetadata,
  searchFiles
};