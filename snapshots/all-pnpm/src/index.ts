import { routers } from '@aomex/router';
import { WebApp } from '@aomex/web';
import { appChain } from './chain/web.chain';

export const app = new WebApp();
app.mount(appChain);
app.mount(routers('./src/routers'));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server started');
});
