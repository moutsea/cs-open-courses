/**
 * 允许的安全HTML标签白名单
 */
const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'strong', 'em', 'b', 'i', 'u', 'del', 'ins',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'kbd'
]);

/**
 * 允许的安全HTML属性白名单
 */
const ALLOWED_ATTR = new Set([
  'href', 'src', 'alt', 'title', 
  'class', 'id', 
  'width', 'height',
  'data-language' // 用于代码高亮
]);

/**
 * 危险的XSS模式
 */
const XSS_PATTERNS = [
  /javascript:/gi,
  /data:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi, // onclick, onerror, etc.
  /<script\b/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /<form\b/i,
  /<input\b/i,
  /<button\b/i,
  /expression\s*\(/gi, // CSS expression
  /@import/gi,
  /-moz-binding/gi
];

/**
 * 净化HTML内容，移除潜在的XSS攻击代码
 * @param html - 需要净化的HTML字符串
 * @returns 净化后的安全HTML字符串
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    let sanitized = html;
    
    // 1. 移除明显的XSS攻击模式
    for (const pattern of XSS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    // 2. 移除HTML注释（可能包含恶意代码）
    sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
    
    // 3. 使用简单的标签过滤
    sanitized = sanitized.replace(/<([^>]+)>/g, (match, tagContent) => {
      // 处理结束标签
      if (tagContent.startsWith('/')) {
        const tagName = tagContent.substring(1).trim();
        return ALLOWED_TAGS.has(tagName.toLowerCase()) ? match : '';
      }
      
      // 处理自闭合标签
      if (tagContent.endsWith('/')) {
        const [tagName] = tagContent.substring(0, tagContent.length - 1).trim().split(/\s+/);
        return ALLOWED_TAGS.has(tagName.toLowerCase()) ? match : '';
      }
      
      // 处理开始标签
      const [tagName, ...attrs] = tagContent.trim().split(/\s+/);
      if (!ALLOWED_TAGS.has(tagName.toLowerCase())) {
        return '';
      }
      
      // 过滤属性
      const cleanAttrs = attrs.filter((attr: string) => {
        const [attrName] = attr.split('=');
        return ALLOWED_ATTR.has(attrName.toLowerCase());
      });
      
      if (cleanAttrs.length === 0) {
        return `<${tagName}>`;
      }
      
      return `<${tagName} ${cleanAttrs.join(' ')}>`;
    });
    
    return sanitized;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return '';
  }
}

/**
 * 净化Markdown渲染的HTML内容，专门用于课程内容
 * @param markdownHtml - 从Markdown转换的HTML
 * @returns 净化后的安全HTML
 */
export function sanitizeMarkdownHTML(markdownHtml: string): string {
  if (!markdownHtml) return '';

  try {
    // 对于markdown内容，我们使用更宽松的设置
    return sanitizeHTML(markdownHtml);
  } catch (error) {
    console.error('Error sanitizing markdown HTML:', error);
    return '';
  }
}