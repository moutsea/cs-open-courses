import { Marked, Renderer } from 'marked';
import hljs from 'highlight.js';
import { resolveCourseMarkdownLink, type CourseLinkContext } from './courseLinks';
import { sanitizeMarkdownHTML, type HTMLSanitizerOptions } from './htmlSanitizer';

export async function markdownToHTML(markdown: string, context?: CourseLinkContext, options?: HTMLSanitizerOptions): Promise<string> {
  // Configure marked options
  const renderer = new Renderer();
  const renderLink = renderer.link;
  renderer.link = function(token) {
    return renderLink.call(this, {
      ...token,
      href: context ? resolveCourseMarkdownLink(token.href, context) : token.href
    });
  };
  
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
  
  const parser = new Marked({
    renderer: renderer,
    breaks: true,
    gfm: true,
  });

  // Convert markdown to HTML
  const html = parser.parse(markdown, { async: false });
  
  // Sanitize after all Markdown rendering and highlighting, before sending HTML
  // to the client. The browser should not need a second HTML parsing pipeline.
  return sanitizeMarkdownHTML(html, options);
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
