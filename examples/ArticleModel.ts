/**
 * Example Article Model Implementation
 * 
 * Demonstrates complex field types, nested objects, and arrays
 * using the decorator-based schema definition approach.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEmail, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import 'reflect-metadata';
import { Editor, Field, Schema } from '../src/decorators';
import { DataType, FieldType, SchemaProps } from '../src/types';
import { Model } from '../src/models/Model';

@Schema('Author', '1.0.0')
export class AuthorModel extends Model {
  @Field({ required: true })
  @Editor({
    field_type: FieldType.TEXT,
    label: 'Name',
    description: 'Author full name'
  })
  @IsString()
  @Length(1, 100)
  name!: string;

  @Field({ required: false })
  @Editor({
    field_type: FieldType.EMAIL,
    label: 'Email',
    description: 'Author email address'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ required: false })
  @Editor({
    field_type: FieldType.TEXTAREA,
    label: 'Bio',
    description: 'Author biography'
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;
}

@Schema('Tag', '1.0.0')
export class TagModel extends Model {
  @Field({ required: true })
  @Editor({
    field_type: FieldType.TEXT,
    label: 'Tag Name',
    description: 'Tag label'
  })
  @IsString()
  @Length(1, 50)
  name!: string;

  @Field({ required: false })
  @Editor({
    field_type: FieldType.COLOR,
    label: 'Color',
    description: 'Tag display color'
  })
  @IsOptional()
  @IsString()
  color?: string;
}

@Schema('Article', '1.0.0')
export class ArticleModel extends Model {
  @Field({ required: true })
  @Editor({
    field_type: FieldType.TEXT,
    label: 'Title',
    description: 'Article title',
    validation: { min: 5, max: 200 }
  })
  @IsString()
  @Length(5, 200)
  title!: string;

  @Field({ required: false })
  @Editor({
    field_type: FieldType.TEXTAREA,
    label: 'Summary',
    description: 'Brief article summary',
    validation: { max: 500 }
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  summary?: string;

  @Field({ required: true })
  @Editor({
    field_type: FieldType.TEXTAREA,
    label: 'Content',
    description: 'Full article content'
  })
  @IsString()
  @Length(10, 10000)
  content!: string;

  @Field({ required: true, type: 'Author' })
  @Editor({
    field_type: FieldType.FORM,
    label: 'Author',
    description: 'Article author information'
  })
  @ValidateNested()
  @Type(() => AuthorModel)
  author!: AuthorModel;

  @Field({ required: false, type: DataType.ARRAY, defaultValue: [] })
  @Editor({
    field_type: FieldType.MODEL_REPEATER,
    label: 'Tags',
    description: 'Article tags'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagModel)
  tags?: TagModel[];

  @Field({ required: false })
  @Editor({
    field_type: FieldType.IMAGE,
    label: 'Featured Image',
    description: 'Article featured image'
  })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @Field({ required: true })
  @Editor({
    field_type: FieldType.DATE_TIME,
    label: 'Published Date',
    description: 'Article publication date'
  })
  @IsDateString()
  publishedAt!: string;

  @Field({ required: false, defaultValue: false })
  @Editor({
    field_type: FieldType.BOOLEAN,
    label: 'Featured',
    description: 'Mark as featured article'
  })
  @IsOptional()
  featured?: boolean;
}

/**
 * Type-safe props for Article component
 */
export type ArticleProps = SchemaProps<ArticleModel> & {
  dataSource?: string;
  className?: string;
  onAuthorClick?: (author: AuthorModel) => void;
  onTagClick?: (tag: TagModel) => void;
};