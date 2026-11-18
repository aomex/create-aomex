import { Auth, AuthError } from '@aomex/auth';
import { AuthBearerStrategy } from '@aomex/auth/bearer';
import { CookieKey } from '@/constants/cookie-key';
import { services } from '@/services';
import { AuthJwtStrategy } from '@aomex/auth-jwt-strategy';
import { AuthApiKeyStrategy } from '@aomex/auth/api-key';

/**
 * Bearer：不透明令牌，可随时吊销；JWT：无状态令牌；API Key：默认从 x-api-key 读取。
 * 路由用法：`auth.authenticate('bearer' | 'jwt' | 'apiKey')`
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
    jwt: new AuthJwtStrategy({
      secret: process.env['JWT_SECRET'] || 'change-me-in-production',
      async onVerified(payload: { userId: number }) {
        return { id: payload.userId };
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
    apiKey: new AuthApiKeyStrategy({
      async onLoaded(apiKey) {
        // TODO: 按 apiKey 查询应用身份
        if (!apiKey) return false;
        return { apiKey };
      },
      onAuthorize() {
        return true;
      },
      keyLoaders: [{ type: 'header', key: 'x-api-key' }],
    }),
  },
});

export { AuthError };
