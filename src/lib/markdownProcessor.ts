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

  const renderHeading = renderer.heading;
  renderer.heading = function(token) {
    const heading = renderHeading.call(this, token);
    if (context?.locale === 'zh' && token.depth === 2 && token.text.trim() === '课程资源') {
      return `${heading}<div class="my-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 px-5 py-4"><p class="m-0">🎁 添加微信<strong class="font-semibold text-emerald-200">liangtangjhz</strong>免费领取互联网大厂面试资料</p></div>`;
    }
    return heading;
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
