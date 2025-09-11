#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const courseDir = path.join(process.cwd(), 'src/app/[locale]/course');

function fixQuotesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix the pattern: summary: "..."Some text"..." 
    const fixedContent = content.replace(
      /summary:\s*"([^"]*)"([^"]*)"([^"]*)"/g,
      (match, beforeQuote, quotedText, afterQuote) => {
        return `summary: "${beforeQuote}\\"${quotedText}\\"${afterQuote}"`;
      }
    );
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf-8');
      console.log(`Fixed quotes in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

function scanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      scanDirectory(itemPath);
    } else if (item.endsWith('.tsx')) {
      fixQuotesInFile(itemPath);
    }
  }
}

console.log('Scanning for quote issues...');
scanDirectory(courseDir);
console.log('Done!');