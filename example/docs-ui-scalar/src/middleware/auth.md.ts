import { Auth, AuthError } from '@aomex/auth';
import { AuthBearerStrategy } from '@aomex/auth/bearer';
// import { AuthJwtStrategy } from '@aomex/auth-jwt-strategy';
// import { AuthApiKeyStrategy } from '@aomex/auth/api-key';
// import { AuthSessionStrategy } from '@aomex/auth/session';
// import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';
import { CookieKey } from '@/constants/cookie-key';
// import { configs } from '@/configs';
import { services } from '@/services';

/**
 * 已启用：Bearer。未勾选的 Auth 策略仍保留为注释。
 * 路由用法：`auth.authenticate('bearer')`
 */
export const auth = new Auth({
  strategies: {
    /** Bearer：不透明令牌，可随时吊销 */
    bearer: new AuthBearerStrategy({
      async onLoaded(token) {
        const userId = await services.cache.getUserIdByToken(token, true);
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
    // jwt: new AuthJwtStrategy({
    //   secret: process.env['JWT_SECRET'] || 'change-me-in-production',
    //   async onVerified(payload: { userId: number }) {
    //     // TODO: 按 userId 查询用户记录后返回
    //     // const user = await services.user.findById(payload.userId);
    //     // if (!user) return false;
    //     // return user;
    //     return { id: payload.userId };
    //   },
    //   onAuthorize() {
    //     return true;
    //   },
    //   tokenLoaders: [
    //     { type: 'header', key: 'authorization' },
    //     { type: 'cookie', key: CookieKey.ACCESS_TOKEN },
    //     { type: 'query', key: 'access_token' },
    //   ],
    // }),

    /** API Key：默认从 x-api-key 读取 */
    // apiKey: new AuthApiKeyStrategy({
    //   async onLoaded(apiKey) {
    //     if (!apiKey) return false;
    //     // TODO: 按 apiKey 查询应用身份后返回
    //     // const app = await services.app.findByApiKey(apiKey);
    //     // if (!app) return false;
    //     // return app;
    //     return { apiKey };
    //   },
    //   onAuthorize() {
    //     return true;
    //   },
    //   keyLoaders: [{ type: 'header', key: 'x-api-key' }],
    // }),

    /** Session：Cookie 存 sessionId，数据在 cache（如 Redis） */
    // session: new AuthSessionStrategy({
    //   store: new CacheRedisAdapter(configs.redis),
    //   cookie: {
    //     name: CookieKey.SESSION_ID,
    //     maxAge: 60 * 60 * 24 * 7, // 秒；同时作为缓存 TTL
    //     httpOnly: true,
    //     sameSite: 'lax',
    //     // secure: true, // 仅 HTTPS
    //   },
    //   sliding: true,
    //   async onLoaded(data: { userId: number }) {
    //     // TODO: 按 userId 查询用户记录后返回
    //     // const user = await services.user.findById(data.userId);
    //     // if (!user) return false;
    //     // return user;
    //     return { id: data.userId };
    //   },
    //   onAuthorize() {
    //     return true;
    //   },
    // }),
  },
});

export { AuthError };
