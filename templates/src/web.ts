import { WebApp } from '@aomex/web';
import { appChain } from './middleware/web.chain';

export const app = new WebApp({
  locale: 'zh_CN',
  mount: appChain,
});

app.listen(process.env['PORT'] || 3000, () => {
  console.log('服务已启动');
});
