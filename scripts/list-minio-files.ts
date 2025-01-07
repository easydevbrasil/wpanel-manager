#!/usr/bin/env tsx
/**
 * List files in MinIO bucket to verify migration
 */

import { MinioService } from '../server/minio';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('🔍 Checking files in MinIO bucket...');
    
    // Initialize MinIO service
    await MinioService.initialize();
    
    // List files
    const files = await MinioService.listFiles();
    
    console.log(`📁 Found ${files.length} files in MinIO bucket:`);
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.size} bytes, ${file.lastModified})`);
    });
    
  } catch (error) {
    console.error('❌ Error listing files:', error);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}