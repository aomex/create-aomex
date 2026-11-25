import { Auth, AuthError } from '@aomex/auth';
import { AuthBearerStrategy } from '@aomex/auth/bearer';
import { AuthJwtStrategy } from '@aomex/auth-jwt-strategy';
import { AuthApiKeyStrategy } from '@aomex/auth/api-key';
import { AuthSessionStrategy } from '@aomex/auth/session';
import { cache } from '@/services/cache.service';
import { CookieKey } from '@/constants/cookie-key';
import { services } from '@/services';

/**
 * 已启用：Bearer / JWT / API Key / Session / OAuth2。未勾选的 Auth 策略仍保留为注释。
 * 路由用法：`auth.authenticate('bearer' | 'jwt' | 'apiKey' | 'session')`
 *
 * Session：登录 `await auth.strategy('session').login(ctx, { userId })`；
 * 登出 `logout(ctx)`；防 fixation `regenerateSessionId(ctx)`。
 * Cookie 会话须挂载 `csrf()`，并配置 `cors.credentials` + `cors.origin`。
 * OAuth2 / OIDC / 微信登录：见各厂商 Service 与 `src/routers/oauth2.router.ts`（回调后自行建立 session / JWT / bearer）。
 */
export const auth = new Auth({
  strategies: {
    /** Bearer：不透明令牌，可随时吊销 */
    bearer: new AuthBearerStrategy({
      async onLoaded(token) {
        const userId = await services.passport.getUserIdByToken(token, true);
        if (!userId) return false;
        // TODO: 按 userId 查询用户记录后返回
        // const user = await services.user.findById(userId);
        // if (!user) return false;
        // return user;
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

    /** JWT：无状态令牌 */
    jwt: new AuthJwtStrategy({
      secret: process.env['JWT_SECRET'] || 'change-me-in-production',
      async onVerified(payload: { userId: number }) {
        // TODO: 按 userId 查询用户记录后返回
        // const user = await services.user.findById(payload.userId);
        // if (!user) return false;
        // return user;
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

    /** API Key：默认从 x-api-key 读取 */
    apiKey: new AuthApiKeyStrategy({
      async onLoaded(apiKey) {
        if (!apiKey) return false;
        // TODO: 按 apiKey 查询应用身份后返回
        // const app = await services.app.findByApiKey(apiKey);
        // if (!app) return false;
        // return app;
        return { apiKey };
      },
      onAuthorize() {
        return true;
      },
      keyLoaders: [{ type: 'header', key: 'x-api-key' }],
    }),

    /** Session：Cookie 存 sessionId，数据在 cache（如 Redis） */
    session: new AuthSessionStrategy({
      store: cache,
      cookie: {
        name: CookieKey.SESSION_ID,
        maxAge: 60 * 60 * 24 * 7, // 秒；同时作为缓存 TTL
        httpOnly: true,
        sameSite: 'lax',
        // secure: true, // 仅 HTTPS
      },
      sliding: true,
      async onLoaded(data: { userId: number }) {
        // TODO: 按 userId 查询用户记录后返回
        // const user = await services.user.findById(data.userId);
        // if (!user) return false;
        // return user;
        return { id: data.userId };
      },
      onAuthorize() {
        return true;
      },
    }),
  },
});

export { AuthError };
