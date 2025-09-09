import { marked } from 'marked';
import hljs from 'highlight.js';

export async function markdownToHTML(markdown: string): Promise<string> {
  // Configure marked options
  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {
          console.error('Highlight.js error:', err);
        }
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true,
  });

  // Convert markdown to HTML
  const html = marked(markdown);
  
  return html;
}

export function extractTitleFromMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const firstLine = lines.find(line => line.startsWith('# '));
  if (firstLine) {
    return firstLine.substring(2).trim();
  }
  
  // Fallback to filename if no title found
  return 'Untitled';
}

export function cleanMarkdownForDisplay(markdown: string): string {
  // Remove any problematic content or add necessary formatting
  return markdown;
}