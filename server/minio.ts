import { Client as MinioClient } from 'minio';
import { S3Client, CreateBucketCommand, PutBucketVersioningCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// MinIO configuration from environment variables
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT?.replace(/^https?:\/\//, '') || 'localhost',
  port: process.env.MINIO_ENDPOINT?.startsWith('https') ? 443 : 9000,
  useSSL: process.env.MINIO_ENDPOINT?.startsWith('https') || false,
  accessKey: process.env.MINIO_ROOT_USER || 'admin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'password',
};

const bucketName = process.env.MINIO_BUCKET || 'wpanel';

// Create MinIO client
export const minioClient = new MinioClient(minioConfig);

// Create S3 client for advanced operations
export const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: minioConfig.accessKey,
    secretAccessKey: minioConfig.secretKey,
  },
  forcePathStyle: true, // Required for MinIO
});

export class MinioService {
  
  /**
   * Initialize MinIO service - create bucket and configure it
   */
  static async initialize(): Promise<void> {
    try {
      console.log('[MinIO] Initializing MinIO service...');
      
      // Check if bucket exists, create if not
      const bucketExists = await minioClient.bucketExists(bucketName);
      
      if (!bucketExists) {
        console.log(`[MinIO] Creating bucket: ${bucketName}`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`[MinIO] Bucket ${bucketName} created successfully`);
      } else {
        console.log(`[MinIO] Bucket ${bucketName} already exists`);
      }
      
      // Enable versioning
      await this.enableVersioning();
      
      // Set bucket policy to private
      await this.setBucketPolicy();
      
      console.log('[MinIO] MinIO service initialized successfully');
      
    } catch (error) {
      console.error('[MinIO] Error initializing MinIO service:', error);
      throw error;
    }
  }
  
  /**
   * Enable versioning on the bucket
   */
  static async enableVersioning(): Promise<void> {
    try {
      console.log('[MinIO] Enabling versioning...');
      
      await s3Client.send(new PutBucketVersioningCommand({
        Bucket: bucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      }));
      
      console.log('[MinIO] Versioning enabled successfully');
    } catch (error) {
      console.error('[MinIO] Error enabling versioning:', error);
      throw error;
    }
  }
  
  /**
   * Set bucket policy to private
   */
  static async setBucketPolicy(): Promise<void> {
    try {
      console.log('[MinIO] Setting bucket policy to private...');
      
      // Simple policy to deny public access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${bucketName}/*`
          }
        ]
      };
      
      await s3Client.send(new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy)
      }));
      
      console.log('[MinIO] Bucket policy set to private successfully');
    } catch (error) {
      console.error('[MinIO] Error setting bucket policy:', error);
      // Don't throw error for policy as it's not critical for functionality
    }
  }
  
  /**
   * Upload file to MinIO
   */
  static async uploadFile(
    filePath: string, 
    objectName: string, 
    contentType?: string
  ): Promise<string> {
    try {
      console.log(`[MinIO] Uploading file: ${objectName}`);
      
      const fileStream = fs.createReadStream(filePath);
      const stat = fs.statSync(filePath);
      
      const metaData = {
        'Content-Type': contentType || 'application/octet-stream',
        'Uploaded-By': 'wpanel',
        'Upload-Date': new Date().toISOString()
      };
      
      await minioClient.putObject(bucketName, objectName, fileStream, stat.size, metaData);
      
      console.log(`[MinIO] File uploaded successfully: ${objectName}`);
      return objectName;
      
    } catch (error) {
      console.error(`[MinIO] Error uploading file ${objectName}:`, error);
      throw error;
    }
  }
  
  /**
   * Upload buffer to MinIO
   */
  static async uploadBuffer(
    buffer: Buffer,
    objectName: string,
    contentType?: string
  ): Promise<string> {
    try {
      console.log(`[MinIO] Uploading buffer: ${objectName}`);
      
      const metaData = {
        'Content-Type': contentType || 'application/octet-stream',
        'Uploaded-By': 'wpanel',
        'Upload-Date': new Date().toISOString()
      };
      
      await minioClient.putObject(bucketName, objectName, buffer, buffer.length, metaData);
      
      console.log(`[MinIO] Buffer uploaded successfully: ${objectName}`);
      return objectName;
      
    } catch (error) {
      console.error(`[MinIO] Error uploading buffer ${objectName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get presigned URL for secure file access
   */
  static async getPresignedUrl(objectName: string, expiry: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const url = await minioClient.presignedGetObject(bucketName, objectName, expiry);
      return url;
    } catch (error) {
      console.error(`[MinIO] Error getting presigned URL for ${objectName}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete file from MinIO
   */
  static async deleteFile(objectName: string): Promise<void> {
    try {
      console.log(`[MinIO] Deleting file: ${objectName}`);
      await minioClient.removeObject(bucketName, objectName);
      console.log(`[MinIO] File deleted successfully: ${objectName}`);
    } catch (error) {
      console.error(`[MinIO] Error deleting file ${objectName}:`, error);
      throw error;
    }
  }
  
  /**
   * Check if file exists
   */
  static async fileExists(objectName: string): Promise<boolean> {
    try {
      await minioClient.statObject(bucketName, objectName);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * List files with prefix
   */
  static async listFiles(prefix: string = ''): Promise<any[]> {
    try {
      const objectsList: any[] = [];
      const objectsStream = minioClient.listObjects(bucketName, prefix, true);
      
      return new Promise((resolve, reject) => {
        objectsStream.on('data', (obj) => {
          objectsList.push(obj);
        });
        
        objectsStream.on('error', (err) => {
          reject(err);
        });
        
        objectsStream.on('end', () => {
          resolve(objectsList);
        });
      });
    } catch (error) {
      console.error(`[MinIO] Error listing files with prefix ${prefix}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate object name for upload
   */
  static generateObjectName(type: 'products' | 'clients' | 'suppliers' | 'general', originalName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    return `${type}/${timestamp}-${randomId}-${nameWithoutExt}${extension}`;
  }
}

// Initialize MinIO on module load
MinioService.initialize().catch(console.error);

export default MinioService;