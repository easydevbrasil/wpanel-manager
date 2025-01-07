#!/usr/bin/env tsx
/**
 * Migration script to move files from local storage to MinIO S3
 */

import { MinioService } from '../server/minio';
import { FilesMigrationService } from '../server/migration';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('🚀 Starting migration to MinIO...');
    
    // Initialize MinIO service
    console.log('📡 Initializing MinIO service...');
    await MinioService.initialize();
    console.log('✅ MinIO service initialized');
    
    // Initialize migration service
    const filesMigration = new FilesMigrationService();
    
    // Create backup before migration
    console.log('💾 Creating backup before migration...');
    await filesMigration.createBackup();
    console.log('✅ Backup created');
    
    // Run migration
    console.log('🔄 Running migration...');
    await filesMigration.migrateAllFiles();
    console.log('✅ Migration completed successfully!');
    
    console.log('🎉 All files have been migrated to MinIO S3');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}