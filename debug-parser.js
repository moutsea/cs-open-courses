// Direct test of the parser
const { parseMarkdownFile } = require('./src/lib/courseParser.ts');

async function testParser() {
  try {
    console.log('Testing CS50 course...');
    const result = await parseMarkdownFile('./cs-self-learning/docs/人工智能/CS50.md');
    console.log('CS50 Result:', {
      title: result.title,
      programmingLanguage: result.programmingLanguage,
      difficulty: result.difficulty,
      duration: result.duration,
      summary: result.summary?.substring(0, 50) + '...'
    });

    console.log('\nTesting CS50 English version...');
    const resultEn = await parseMarkdownFile('./cs-self-learning/docs/人工智能/CS50.en.md');
    console.log('CS50 English Result:', {
      title: resultEn.title,
      programmingLanguage: resultEn.programmingLanguage,
      difficulty: resultEn.difficulty,
      duration: resultEn.duration,
      summary: resultEn.summary?.substring(0, 50) + '...'
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testParser();