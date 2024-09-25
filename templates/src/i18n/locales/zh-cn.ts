import { I18n } from '@aomex/core';

export const zh = I18n.define({
  hello: I18n.message('你好，世界。{{count}}', {
    count: {
      type: 'plural',
      plural: {
        '1': '这是你第一次访问',
        '2-4': '你表现的很熟练',
        'n': '你是个老司机',
      },
    },
  }),
  button: {
    ok: '确定',
    cancel: '取消',
  },
});
