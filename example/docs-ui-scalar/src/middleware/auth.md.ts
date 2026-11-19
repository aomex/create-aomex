import { Auth, AuthError } from '@aomex/auth';
import { AuthBearerStrategy } from '@aomex/auth/bearer';
import { CookieKey } from '@/constants/cookie-key';
import { services } from '@/services';

/**
 * Bearer：不透明令牌，可随时吊销。
 * 路由用法：`auth.authenticate('bearer')`
 */
export const auth = new Auth({
  strategies: {
    bearer: new AuthBearerStrategy({
      async onLoaded(token) {
        const userId = await services.cache.getUserIdByToken(token, true);
        if (!userId) return false;
        return { id: userId };
      },
      onAuthorize() {
        return true;
      },
      tokenLoaders: [
        { type: 'header', key: 'authorization' },
        { type: 'cookie', key: CookieKey.ACCESS_TOKEN },
        { type: 'query', key: 'access_token' },
      ],
    }),
  },
});

export { AuthError };
