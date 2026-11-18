import { formatError } from '@aomex/web';
import { rule } from '@aomex/common';

export const globalErrorRewrite = formatError({
  content: {
    code: rule.string(),
    message: rule.string(),
  },
  handler(err) {
    return {
      code: err.code || '',
      message: err.message,
    };
  },
});
