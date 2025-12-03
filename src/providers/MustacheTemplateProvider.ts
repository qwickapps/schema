/**
 * MustacheTemplateResolver - A pure template resolver using mustache syntax
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import Mustache from 'mustache';
import { TemplateProvider } from "../types";

/**
 * Provides mustache-based template resolution
 * 
 * Features supported:
 * - Variables: {{name}}
 * - Unescaped HTML: {{{html}}}
 * - Sections: {{#items}}...{{/items}}
 * - Inverted sections: {{^empty}}...{{/empty}}
 * - Comments: {{! This is a comment}}
 * - Partials: {{>partial}}
 * 
 * Usage:
 * ```typescript
 * const resolver = new MustacheTemplateResolver();
 * const result = resolver.resolve('Hello {{name}}!', { name: 'World' });
 * // Result: "Hello World!"
 * ```
 */
export class MustacheTemplateProvider implements TemplateProvider {
  
  /**
   * Constructor
   * @param max_passes - Maximum number of resolution passes (default: 1)
   */
  constructor(public max_passes: number = 1) {
    // Configure mustache for security - escape HTML by default
    Mustache.escape = (text) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };
  }

  /**
   * Resolve template with given context
   * 
   * @param template - Mustache template string
   * @param context - Data context for template resolution
   * @returns Resolved template string
   */
  resolve(template: string, context: any): string {
    if (!template) {
      return '';
    }

    if (!template.includes('{{')) {
      // No mustache syntax, return as-is
      return template;
    }

    try {
      let result = template;
      for (let pass = 0; pass < this.max_passes; pass++) {
        const resolved = Mustache.render(result, context);
        if (resolved === result) {
          // No further changes, stop processing
          break;
        }
        result = resolved;
      }
      return result;
    } catch (error) {
      throw new Error(`Template resolution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}