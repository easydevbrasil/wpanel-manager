import { db } from "./db";
import { containerLogos, products, clients, suppliers } from "../shared/schema";
import MinioService from "./minio";
import * as fs from "fs";
import * as path from "path";
import { eq } from "drizzle-orm";

interface MigrationResult {
  success: boolean;
  message: string;
  originalUrl?: string;
  newUrl?: string;
}

/**
 * Migration script to move all files from local uploads directory to MinIO S3
 */
export class FilesMigrationService {
  
  private uploadsDir = path.join(process.cwd(), "uploads");
  
  /**
   * Migrate all files to MinIO and update database references
   */
  async migrateAllFiles(): Promise<void> {
    console.log('[Migration] Starting files migration from local storage to MinIO...');
    
    try {
      // 1. Migrate container logos
      await this.migrateContainerLogos();
      
      // 2. Migrate product images
      await this.migrateProductImages();
      
      // 3. Migrate remaining files in uploads directory
      await this.migrateRemainingFiles();
      
      // 4. Clean up local uploads directory (optional - keep for safety)
      // await this.cleanupLocalFiles();
      
      console.log('[Migration] Files migration completed successfully!');
      
    } catch (error) {
      console.error('[Migration] Error during files migration:', error);
      throw error;
    }
  }
  
  /**
   * Migrate container logos from database references
   */
  private async migrateContainerLogos(): Promise<void> {
    console.log('[Migration] Migrating container logos...');
    
    try {
      const logos = await db.select().from(containerLogos);
      
      for (const logo of logos) {
        if (logo.logoUrl && logo.logoUrl.startsWith('/uploads/')) {
          const result = await this.migrateFile(logo.logoUrl, 'general');
          
          if (result.success && result.newUrl) {
            // Update database with new MinIO URL
            await db.update(containerLogos)
              .set({ logoUrl: result.newUrl })
              .where(eq(containerLogos.id, logo.id));
              
            console.log(`[Migration] Updated container logo ${logo.id}: ${result.originalUrl} -> ${result.newUrl}`);
          }
        }
      }
      
    } catch (error) {
      console.error('[Migration] Error migrating container logos:', error);
    }
  }
  
  /**
   * Migrate product images from database references
   */
  private async migrateProductImages(): Promise<void> {
    console.log('[Migration] Migrating product images...');
    
    try {
      const productsWithImages = await db.select().from(products);
      
      for (const product of productsWithImages) {
        let updated = false;
        
        // Migrate single image field
        if (product.image && product.image.startsWith('/uploads/')) {
          const result = await this.migrateFile(product.image, 'products');
          if (result.success && result.newUrl) {
            await db.update(products)
              .set({ image: result.newUrl })
              .where(eq(products.id, product.id));
            updated = true;
            console.log(`[Migration] Updated product ${product.id} image: ${result.originalUrl} -> ${result.newUrl}`);
          }
        }
        
        // Migrate images array
        if (product.images && Array.isArray(product.images)) {
          const newImages: string[] = [];
          let imagesUpdated = false;
          
          for (const imageUrl of product.images) {
            if (typeof imageUrl === 'string' && imageUrl.startsWith('/uploads/')) {
              const result = await this.migrateFile(imageUrl, 'products');
              if (result.success && result.newUrl) {
                newImages.push(result.newUrl);
                imagesUpdated = true;
                console.log(`[Migration] Migrated product ${product.id} image: ${result.originalUrl} -> ${result.newUrl}`);
              } else {
                newImages.push(imageUrl); // Keep original if migration failed
              }
            } else {
              newImages.push(imageUrl); // Keep non-uploads URLs
            }
          }
          
          if (imagesUpdated) {
            await db.update(products)
              .set({ images: newImages })
              .where(eq(products.id, product.id));
            updated = true;
          }
        }
        
        if (updated) {
          console.log(`[Migration] Product ${product.id} migration completed`);
        }
      }
      
    } catch (error) {
      console.error('[Migration] Error migrating product images:', error);
    }
  }
  
  /**
   * Migrate any remaining files in uploads directory that aren't referenced in DB
   */
  private async migrateRemainingFiles(): Promise<void> {
    console.log('[Migration] Migrating remaining files in uploads directory...');
    
    try {
      if (!fs.existsSync(this.uploadsDir)) {
        console.log('[Migration] Uploads directory does not exist, skipping...');
        return;
      }
      
      const files = fs.readdirSync(this.uploadsDir);
      
      for (const filename of files) {
        const filePath = path.join(this.uploadsDir, filename);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
          const result = await this.migrateFileDirectly(filePath, filename, 'general');
          if (result.success) {
            console.log(`[Migration] Migrated remaining file: ${filename} -> ${result.newUrl}`);
          }
        }
      }
      
    } catch (error) {
      console.error('[Migration] Error migrating remaining files:', error);
    }
  }
  
  /**
   * Migrate a single file by URL reference
   */
  private async migrateFile(fileUrl: string, category: 'products' | 'clients' | 'suppliers' | 'general'): Promise<MigrationResult> {
    try {
      // Extract filename from URL
      const filename = fileUrl.replace('/uploads/', '');
      const filePath = path.join(this.uploadsDir, filename);
      
      return await this.migrateFileDirectly(filePath, filename, category);
      
    } catch (error) {
      console.error(`[Migration] Error migrating file ${fileUrl}:`, error);
      return {
        success: false,
        message: `Failed to migrate ${fileUrl}: ${error}`,
        originalUrl: fileUrl
      };
    }
  }
  
  /**
   * Migrate a file directly from filesystem
   */
  private async migrateFileDirectly(filePath: string, originalFilename: string, category: 'products' | 'clients' | 'suppliers' | 'general'): Promise<MigrationResult> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: `File not found: ${filePath}`,
          originalUrl: `/uploads/${originalFilename}`
        };
      }
      
      // Generate object name for MinIO
      const objectName = MinioService.generateObjectName(category, originalFilename);
      
      // Upload to MinIO
      const uploadedPath = await MinioService.uploadFile(filePath, objectName, this.getMimeType(originalFilename));
      
      // Generate presigned URL for immediate access
      const presignedUrl = await MinioService.getPresignedUrl(uploadedPath, 365 * 24 * 60 * 60); // 1 year expiry for permanent files
      
      return {
        success: true,
        message: `Successfully migrated ${originalFilename}`,
        originalUrl: `/uploads/${originalFilename}`,
        newUrl: presignedUrl
      };
      
    } catch (error) {
      console.error(`[Migration] Error migrating file ${filePath}:`, error);
      return {
        success: false,
        message: `Failed to migrate ${originalFilename}: ${error}`,
        originalUrl: `/uploads/${originalFilename}`
      };
    }
  }
  
  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  /**
   * Clean up local files after successful migration (use with caution)
   */
  private async cleanupLocalFiles(): Promise<void> {
    console.log('[Migration] Cleaning up local files...');
    
    try {
      if (!fs.existsSync(this.uploadsDir)) {
        return;
      }
      
      const files = fs.readdirSync(this.uploadsDir);
      
      for (const filename of files) {
        const filePath = path.join(this.uploadsDir, filename);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          console.log(`[Migration] Deleted local file: ${filename}`);
        }
      }
      
    } catch (error) {
      console.error('[Migration] Error during cleanup:', error);
    }
  }
  
  /**
   * Create a backup of all files before migration
   */
  async createBackup(): Promise<void> {
    console.log('[Migration] Creating backup of uploads directory...');
    
    try {
      const backupDir = path.join(process.cwd(), 'uploads_backup_' + Date.now());
      
      if (fs.existsSync(this.uploadsDir)) {
        await fs.promises.cp(this.uploadsDir, backupDir, { recursive: true });
        console.log(`[Migration] Backup created at: ${backupDir}`);
      }
      
    } catch (error) {
      console.error('[Migration] Error creating backup:', error);
      throw error;
    }
  }
}

// Export migration service instance
export const filesMigration = new FilesMigrationService();