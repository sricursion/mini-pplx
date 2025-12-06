import { describe, it, expect } from 'vitest';
import { sanitizeInput, isInputSafe, escapeHtml } from './input-sanitizer';

describe('Input Sanitizer', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeInput(input);
      expect(result).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick=alert("xss")>Hello</div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello');
    });

    it('should remove null bytes', () => {
      const input = 'Hello\0World';
      const result = sanitizeInput(input);
      expect(result).toBe('HelloWorld');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should handle legitimate queries', () => {
      const input = 'What is the weather today?';
      const result = sanitizeInput(input);
      expect(result).toBe('What is the weather today?');
    });

    it('should handle non-string input', () => {
      const result = sanitizeInput(123 as any);
      expect(result).toBe('');
    });
  });

  describe('isInputSafe', () => {
    it('should detect script tags', () => {
      expect(isInputSafe('<script>alert("xss")</script>')).toBe(false);
      expect(isInputSafe('<SCRIPT>alert("xss")</SCRIPT>')).toBe(false);
    });

    it('should detect javascript: protocol', () => {
      expect(isInputSafe('javascript:alert("xss")')).toBe(false);
      expect(isInputSafe('JAVASCRIPT:alert("xss")')).toBe(false);
    });

    it('should detect event handlers', () => {
      expect(isInputSafe('onclick=alert("xss")')).toBe(false);
      expect(isInputSafe('onload=alert("xss")')).toBe(false);
    });

    it('should detect iframe tags', () => {
      expect(isInputSafe('<iframe src="evil.com"></iframe>')).toBe(false);
    });

    it('should detect object tags', () => {
      expect(isInputSafe('<object data="evil.swf"></object>')).toBe(false);
    });

    it('should detect embed tags', () => {
      expect(isInputSafe('<embed src="evil.swf">')).toBe(false);
    });

    it('should detect eval calls', () => {
      expect(isInputSafe('eval(malicious_code)')).toBe(false);
    });

    it('should allow safe queries', () => {
      expect(isInputSafe('What is the weather today?')).toBe(true);
      expect(isInputSafe('How do I learn JavaScript?')).toBe(true);
      expect(isInputSafe('Tell me about React hooks')).toBe(true);
    });

    it('should handle non-string input', () => {
      expect(isInputSafe(123 as any)).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less than', () => {
      expect(escapeHtml('5 < 10')).toBe('5 &lt; 10');
    });

    it('should escape greater than', () => {
      expect(escapeHtml('10 > 5')).toBe('10 &gt; 5');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('Say "hello"')).toBe('Say &quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("It's working")).toBe('It&#x27;s working');
    });

    it('should escape forward slashes', () => {
      expect(escapeHtml('path/to/file')).toBe('path&#x2F;to&#x2F;file');
    });

    it('should escape multiple special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(123 as any)).toBe('');
    });
  });
});
