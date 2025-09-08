const { buildCourseStructure } = require('./src/lib/courseParser.ts');

async function debugCourses() {
  try {
    const categories = await buildCourseStructure();
    
    let totalChinese = 0;
    let totalEnglish = 0;
    
    categories.forEach(category => {
      category.courses.forEach(course => {
        totalChinese++;
        if (course.hasEnglishVersion) {
          totalEnglish++;
        }
      });
    });
    
    console.log('Total Chinese courses:', totalChinese);
    console.log('Total English courses:', totalEnglish);
    console.log('Total categories:', categories.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugCourses();