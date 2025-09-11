import { getEnglishSlug } from './categoryMapping';

/**
 * 将文件系统路径转换为 URL 安全的路径参数
 * @param filePath 文件系统路径，如 "zh/programming-introduction/python/CS50P.md"
 * @returns URL 安全的路径参数，如 "programming-introduction/python/CS50P"
 */
export function encodeFilePathToURL(filePath: string): string {
  // 移除语言前缀和文件扩展名，只保留路径部分
  const pathParts = filePath.split('/');
  // 去掉语言部分（第一个元素）和文件扩展名
  const pathWithoutLocale = pathParts.slice(1); // 移除语言前缀
  const lastPart = pathWithoutLocale[pathWithoutLocale.length - 1];
  if (lastPart && lastPart.endsWith('.md')) {
    pathWithoutLocale[pathWithoutLocale.length - 1] = lastPart.replace('.md', '');
  }
  
  // 将目录部分转换为英文 slug，文件名保持不变
  return pathWithoutLocale.map((segment, index) => {
    // 如果不是最后一个部分（文件名），则转换为英文 slug
    if (index < pathWithoutLocale.length - 1) {
      return getEnglishSlug(segment);
    }
    // 文件名部分，进行 URL 编码但不改变标识符
    return segment;
  }).join('/');
}

/**
 * 将 URL 路径解码回文件系统路径数组
 * @param urlPath URL 路径数组，如 ["programming-introduction", "python", "CS50P"]
 * @param locale 语言环境，用于查找对应的中文目录名
 * @returns 文件系统路径数组
 */
export function decodeURLToFilePath(urlPath: string[]): string[] {
  // 对于新的动态路由，URL 路径已经是文件系统路径格式
  // 不需要转换，直接返回
  return urlPath;
}

/**
 * 根据课程 ID 构建课程路径
 * @param courseId 课程 ID，如 "programming-getting-started-java-mit-6092"
 * @returns 文件系统路径
 */
export function buildCoursePathFromId(courseId: string): string {
  // 解析课程 ID 来重构路径
  const parts = courseId.split('-');
  
  // 简单的启发式方法来识别路径部分
  const pathParts: string[] = [];
  let currentPart = '';
  
  for (const part of parts) {
    if (currentPart) {
      currentPart += '-' + part;
    } else {
      currentPart = part;
    }
    
    // 检查这是否是一个有效的 slug
    // 这里我们需要实际的目录映射，暂时使用简单的逻辑
    pathParts.push(currentPart);
    currentPart = '';
  }
  
  return pathParts.join('/');
}

/**
 * 构建动态路由的 URL 路径
 * @param filePath 文件系统路径，如 "zh/programming-introduction/python/CS50P.md"
 * @returns 动态路由路径数组，如 ["programming-introduction", "python", "CS50P"]
 */
export function buildDynamicRoutePath(filePath: string): string[] {
  // 移除语言前缀和文件扩展名
  const pathParts = filePath.split('/');
  
  // 检查是否包含语言前缀（如 "zh/" 或 "en/"）
  let pathWithoutLocale = pathParts;
  if (pathParts.length > 1 && (pathParts[0] === 'zh' || pathParts[0] === 'en')) {
    pathWithoutLocale = pathParts.slice(1); // 移除语言前缀
  }
  
  const lastPart = pathWithoutLocale[pathWithoutLocale.length - 1];
  if (lastPart && lastPart.endsWith('.md')) {
    pathWithoutLocale[pathWithoutLocale.length - 1] = lastPart.replace('.md', '');
  }
  
  // 将目录部分转换为英文 slug
  return pathWithoutLocale.map((segment, index) => {
    if (index < pathWithoutLocale.length - 1) {
      return getEnglishSlug(segment);
    }
    return segment;
  });
}

/**
 * 安全地编码路径参数（保留用于向后兼容）
 * @param path 原始路径
 * @returns 编码后的路径
 */
export function encodePathParameter(path: string): string {
  return encodeURIComponent(path);
}

/**
 * 安全地解码路径参数（保留用于向后兼容）
 * @param encodedPath 编码后的路径
 * @returns 解码后的路径
 */
export function decodePathParameter(encodedPath: string): string {
  return decodeURIComponent(encodedPath);
}