// Test script to check course API
const fs = require('fs').promises;
const path = require('path');

async function testCourseAPI() {
  const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs');
  
  try {
    // Get all directories in docs folder
    const categoryDirs = await fs.readdir(docsPath);
    
    for (const categoryDir of categoryDirs) {
      const categoryPath = path.join(docsPath, categoryDir);
      const stats = await fs.stat(categoryPath);
      
      if (!stats.isDirectory() || categoryDir === 'images') continue;
      
      console.log(`\nCategory: ${categoryDir}`);
      
      // Get all items in category directory
      const items = await fs.readdir(categoryPath);
      
      for (const item of items) {
        const itemPath = path.join(categoryPath, item);
        const itemStats = await fs.stat(itemPath);
        
        if (itemStats.isDirectory()) {
          // This is a subcategory
          console.log(`  Subcategory: ${item}`);
          
          // Get courses in subcategory
          const courseFiles = await fs.readdir(itemPath);
          
          for (const courseFile of courseFiles) {
            if (courseFile.endsWith('.md') && !courseFile.endsWith('.en.md')) {
              const courseSlug = courseFile.replace('.md', '');
              // Assuming category slug is the English version of category name
              const categorySlug = categoryDir.toLowerCase().replace(/\s+/g, '-');
              const subcategorySlug = item.toLowerCase().replace(/\s+/g, '-');
              const courseId = `${categorySlug}-${subcategorySlug}-${courseSlug}`;
              console.log(`    Course: ${courseFile} -> ID: ${courseId}`);
            }
          }
        } else if (item.endsWith('.md') && !item.endsWith('.en.md')) {
          // This is a direct course in category
          const courseSlug = item.replace('.md', '');
          const categorySlug = categoryDir.toLowerCase().replace(/\s+/g, '-');
          const courseId = `${categorySlug}-${courseSlug}`;
          console.log(`  Direct Course: ${item} -> ID: ${courseId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCourseAPI();