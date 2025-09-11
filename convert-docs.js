#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Category mapping from the provided file
const categoryMapping = {
  "人工智能": "artificial-intelligence",
  "体系结构": "computer-architecture",
  "并行与分布式系统": "parallel-distributed-systems",
  "必学工具": "essential-tools",
  "操作系统": "operating-systems",
  "数学基础": "mathematics-basics",
  "数学进阶": "advanced-mathematics",
  "数据库系统": "database-systems",
  "数据科学": "data-science",
  "数据结构与算法": "data-structures-algorithms",
  "机器学习": "machine-learning",
  "机器学习系统": "machine-learning-systems",
  "机器学习进阶": "advanced-machine-learning",
  "深度学习": "deep-learning",
  "深度生成模型": "deep-generative-models",
  "电子基础": "electronics-basics",
  "系统安全": "system-security",
  "编程入门": "programming-introduction",
  "编程语言设计与分析": "programming-languages-design",
  "编译原理": "compilers",
  "计算机图形学": "computer-graphics",
  "计算机系统基础": "computer-systems-basics",
  "计算机网络": "computer-networks",
  "软件工程": "software-engineering",
  "Web开发": "web-development"
};

// Subcategory mappings
const subcategoryMapping = {
  "Python": "python",
  "Rust": "rust",
  "Java": "java",
  "cpp": "cpp",
  "C": "c",
  "Functional": "functional",
  "大语言模型": "large-language-models"
};

const docsPath = path.join(__dirname, 'cs-self-learning', 'docs');
const docsNewPath = path.join(__dirname, 'cs-self-learning', 'docs-new');

// Create docs-new directory structure
function createDirectoryStructure() {
  // Create main directories
  fs.mkdirSync(path.join(docsNewPath, 'en'), { recursive: true });
  fs.mkdirSync(path.join(docsNewPath, 'zh'), { recursive: true });
  fs.mkdirSync(path.join(docsNewPath, 'images'), { recursive: true });
  
  console.log('Created directory structure for docs-new');
}

// Get English slug for category name
function getEnglishSlug(chineseName) {
  return categoryMapping[chineseName] || chineseName.toLowerCase().replace(/\s+/g, '-');
}

// Get English slug for subcategory name
function getSubcategorySlug(subcategoryName) {
  return subcategoryMapping[subcategoryName] || subcategoryName.toLowerCase().replace(/\s+/g, '-');
}

// Process a single file
function processFile(filePath, relativePath) {
  const isEnglish = filePath.endsWith('.en.md');
  const isChinese = filePath.endsWith('.md') && !filePath.endsWith('.en.md');
  
  if (!isEnglish && !isChinese) {
    return; // Skip non-markdown files
  }
  
  const pathParts = relativePath.split(path.sep);
  
  // Skip if not deep enough (should have at least category and filename)
  if (pathParts.length < 2) {
    return;
  }
  
  // Extract category, subcategory, and filename from path
  let category, subcategory, filename;
  
  if (pathParts.length === 2) {
    // Format: category/filename.md
    category = pathParts[0];
    subcategory = null;
    filename = pathParts[1];
  } else if (pathParts.length === 3) {
    // Format: category/subcategory/filename.md
    category = pathParts[0];
    subcategory = pathParts[1];
    filename = pathParts[2];
  } else {
    // Skip deeper structures for now
    console.log(`Skipping complex path: ${relativePath}`);
    return;
  }
  
  // Convert category to English slug
  const categorySlug = getEnglishSlug(category);
  let subcategorySlug = null;
  
  if (subcategory) {
    subcategorySlug = getSubcategorySlug(subcategory);
  }
  
  // Determine target directory
  const targetLang = isEnglish ? 'en' : 'zh';
  let targetPath = path.join(docsNewPath, targetLang, categorySlug);
  
  if (subcategorySlug) {
    targetPath = path.join(targetPath, subcategorySlug);
  }
  
  // Create target directory
  fs.mkdirSync(targetPath, { recursive: true });
  
  // Copy file
  const targetFilePath = path.join(targetPath, filename);
  fs.copyFileSync(filePath, targetFilePath);
  
  console.log(`Copied: ${relativePath} -> ${targetLang}/${categorySlug}${subcategorySlug ? '/' + subcategorySlug : ''}/${filename}`);
}

// Recursively scan and process files
function scanDirectory(dirPath, relativePath = '') {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const itemRelativePath = relativePath ? path.join(relativePath, item) : item;
    
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      scanDirectory(itemPath, itemRelativePath);
    } else if (stats.isFile()) {
      processFile(itemPath, itemRelativePath);
    }
  }
}

// Main function
function main() {
  try {
    console.log('Starting docs to docs-new conversion...');
    
    // Clean up existing docs-new if it exists
    if (fs.existsSync(docsNewPath)) {
      fs.rmSync(docsNewPath, { recursive: true, force: true });
    }
    
    // Create directory structure
    createDirectoryStructure();
    
    // Copy images folder if it exists
    const imagesPath = path.join(docsPath, 'images');
    if (fs.existsSync(imagesPath)) {
      fs.cpSync(imagesPath, path.join(docsNewPath, 'images'), { recursive: true });
      console.log('Copied images folder');
    }
    
    // Process all markdown files
    scanDirectory(docsPath);
    
    console.log('✅ Conversion completed successfully!');
    console.log(`📁 New docs structure created at: ${docsNewPath}`);
    
  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
}

main();