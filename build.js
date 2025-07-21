#!/usr/bin/env node

// Custom build script for Vercel deployment
// This script only builds the frontend with Vite
// Server compilation is handled by @vercel/node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function build() {
  try {
    console.log('📦 Building frontend with Vite...');
    
    // Only build the frontend - server will be handled by Vercel
    const { stdout, stderr } = await execAsync('vite build');
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Frontend build completed successfully!');
    console.log('🚀 Server will be compiled by Vercel @vercel/node');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
