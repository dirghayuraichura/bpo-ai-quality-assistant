import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/config.js';

/**
 * File Upload Service using Multer
 * Handles audio file uploads with validation and storage
 */
class UploadService {
  constructor() {
    this.uploadPath = config.upload.uploadPath;
    this.allowedTypes = config.upload.allowedTypes;
    this.maxFileSize = this.parseFileSize(config.upload.maxFileSize);
    
    // Ensure upload directory exists
    this.ensureUploadDirectory();
    
    // Configure multer storage
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname);
        const filename = `${uniqueId}${extension}`;
        cb(null, filename);
      }
    });

    // Configure multer upload
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 1 // Only allow one file at a time
      },
      fileFilter: this.fileFilter.bind(this)
    });
  }

  /**
   * File filter for validation
   */
  fileFilter(req, file, cb) {
    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      const error = new Error(`Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }

    // Check file extension
    const allowedExtensions = ['.wav', '.mp3', '.mpeg', '.mp4', '.flac'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      const error = new Error(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`);
      error.code = 'INVALID_FILE_EXTENSION';
      return cb(error, false);
    }

    cb(null, true);
  }

  /**
   * Get multer upload middleware
   */
  getUploadMiddleware() {
    return this.upload.single('audioFile');
  }

  /**
   * Process uploaded file and return file information
   */
  processUploadedFile(file) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    return {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date()
    };
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error.message);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        exists: true
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * Validate file exists and is accessible
   */
  validateFileAccess(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      throw new Error('File is not accessible');
    }
  }

  /**
   * Parse file size string to bytes
   */
  parseFileSize(sizeString) {
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeString.match(/^(\d+)([A-Z]{1,2})$/);
    if (!match) {
      return 50 * 1024 * 1024; // Default 50MB
    }

    const size = parseInt(match[1]);
    const unit = match[2];
    
    return size * (units[unit] || units['MB']);
  }

  /**
   * Ensure upload directory exists
   */
  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
      console.log(`📁 Created upload directory: ${this.uploadPath}`);
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats() {
    try {
      const files = await fs.promises.readdir(this.uploadPath);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.uploadPath, file);
        const stats = await fs.promises.stat(filePath);
        totalSize += stats.size;
      }

      return {
        totalFiles: files.length,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        uploadPath: this.uploadPath
      };
    } catch (error) {
      console.error('Error getting upload stats:', error.message);
      return {
        totalFiles: 0,
        totalSize: 0,
        totalSizeMB: 0,
        uploadPath: this.uploadPath,
        error: error.message
      };
    }
  }

  /**
   * Clean up old files (optional utility)
   */
  async cleanupOldFiles(maxAgeMs = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const files = await fs.promises.readdir(this.uploadPath);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadPath, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.birthtime.getTime() > maxAgeMs) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }

      console.log(`🧹 Cleaned up ${deletedCount} old files`);
      return deletedCount;
    } catch (error) {
      console.error('Error during cleanup:', error.message);
      throw error;
    }
  }
}

export default new UploadService(); 