/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitize user input by removing potentially dangerous characters and patterns
 * This prevents XSS attacks while preserving legitimate query content
 * 
 * @param input - The raw user input string
 * @returns Sanitized string safe for processing
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove any HTML tags and their content for script/style tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove remaining HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove script-related patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove event handlers (on* attributes with their values)
  // Handles: onclick=value, onclick="value", onclick='value', onclick=func()
  sanitized = sanitized.replace(/on\w+\s*=\s*(?:[^\s"'>]+|"[^"]*"|'[^']*')/gi, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validate that input doesn't contain suspicious patterns
 * 
 * @param input - The input string to validate
 * @returns true if input appears safe, false otherwise
 */
export function isInputSafe(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Escape HTML special characters to prevent XSS
 * Use this when displaying user input in HTML context
 * 
 * @param text - The text to escape
 * @returns HTML-escaped string
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}
