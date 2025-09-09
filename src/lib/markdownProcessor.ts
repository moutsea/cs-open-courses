import { marked } from 'marked';
import hljs from 'highlight.js';

export async function markdownToHTML(markdown: string): Promise<string> {
  // Configure marked options
  const renderer = new marked.Renderer();
  
  // Custom code block rendering with syntax highlighting
  renderer.code = function({ text: code, lang }: { text: string; lang?: string }) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre><code class="hljs language-${lang}">${hljs.highlight(code, { language: lang }).value}</code></pre>`;
      } catch (err) {
        console.error('Highlight.js error:', err);
      }
    }
    return `<pre><code class="hljs">${hljs.highlightAuto(code).value}</code></pre>`;
  };
  
  marked.setOptions({
    renderer: renderer,
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