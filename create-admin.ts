#!/usr/bin/env bun
import { storage } from './server/storage.ts';

async function createAdminUser() {
    try {
        console.log('Creating admin user...');
        await storage.createAdminUser();
        console.log('Admin user created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();