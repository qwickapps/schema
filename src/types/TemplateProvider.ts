/**
 * Pure template resolution provider interface
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */
export interface TemplateProvider {
  /** Resolve template with given context using mustache syntax */
  resolve(template: string, context: any): string;
}
