import { I18n } from '@aomex/core';
import { zh } from './zh-cn';

export const en = I18n.satisfies(zh).define({
  hello: 'Hello World',
});
