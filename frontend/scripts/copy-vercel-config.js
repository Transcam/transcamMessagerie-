import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.join(__dirname, '..', 'vercel.json');
const destFile = path.join(__dirname, '..', 'dist', 'vercel.json');
const distDir = path.join(__dirname, '..', 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy vercel.json to dist
if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, destFile);
  console.log('✅ vercel.json copied to dist/');
} else {
  console.log('⚠️  vercel.json not found, skipping copy');
  process.exit(0);
}

