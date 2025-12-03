/**
 * Example HeroBlock Model Implementation
 * 
 * Demonstrates the decorator-based schema definition approach with
 * field metadata, editor configuration, and validation rules.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { IsOptional, IsString, IsUrl, Length } from 'class-validator';
import 'reflect-metadata';
import { Editor, Field, Schema } from '../src/decorators';
import { FieldType, SchemaProps } from '../src/types';
import { Model } from '../src/models/Model';

@Schema('HeroBlock', '1.0.0')
export class HeroBlockModel extends Model {
  @Field({ required: true })
  @Editor({
    field_type: FieldType.TEXT,
    label: 'Title',
    description: 'Main heading for the hero block',
    placeholder: 'Enter hero title...',
    validation: { min: 1, max: 100 }
  })
  @IsString()
  @Length(1, 100)
  title!: string;

  @Field({ required: false })
  @Editor({
    field_type: FieldType.TEXTAREA,
    label: 'Subtitle',
    description: 'Optional subtitle text',
    placeholder: 'Enter subtitle...',
    validation: { max: 500 }
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  subtitle?: string;

  @Field({ required: false })
  @Editor({
    field_type: FieldType.IMAGE,
    label: 'Background Image',
    description: 'Hero background image URL',
    placeholder: 'https://...'
  })
  @IsOptional()
  @IsUrl()
  backgroundImage?: string;

  @Field({ required: false, defaultValue: 'primary' })
  @Editor({
    field_type: FieldType.SELECT,
    label: 'Theme',
    description: 'Visual theme for the hero block',
    validation: {
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' }
      ]
    }
  })
  @IsOptional()
  @IsString()
  theme?: 'primary' | 'secondary' | 'dark' | 'light';
}

/**
 * Type-safe props for HeroBlock component
 */
export type HeroBlockProps = SchemaProps<HeroBlockModel> & {
  dataSource?: string;
  className?: string;
  onTitleClick?: () => void;
};