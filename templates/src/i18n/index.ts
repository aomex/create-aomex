import { I18n } from '@aomex/core';
import { locales } from './locales';

export const i18n = new I18n({
  locales,
  defaultLanguage: 'zh_CN',
});

// 检查不同语言包的缺失字段（相对于默认语言）
export type I18nMissingKeys = typeof i18n.missingKeys;
