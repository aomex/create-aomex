import { Router } from '@aomex/web';
import { services } from '@/services';

/**
 * OAuth2 / OIDC 授权码登录。
 * 回调后自行建立 session / JWT / bearer。
 */
export const router = new Router({ prefix: '/oauth' });

/** GitHub — pnpm add @aomex-contrib/oauth2-github */
router.get('/github', {
  docs: { showInOpenapi: false },
  action: async (ctx) => {
    await services.github.oauthRedirect(ctx);
  },
});

router.get('/github/callback', {
  docs: { showInOpenapi: false },
  action: async (ctx) => {
    const profile = await services.github.oauthCallback(ctx);
    // TODO: 落库 / 建立登录态（session.login / jwt.signature / passport.setUserIdInToken）
    ctx.send(profile);
  },
});

/** Google（OIDC 整页 redirect） — pnpm add @aomex-contrib/oauth2-google */
router.get('/google', {
  docs: { showInOpenapi: false },
  action: async (ctx) => {
    await services.google.oauthRedirect(ctx);
  },
});

router.get('/google/callback', {
  docs: { showInOpenapi: false },
  action: async (ctx) => {
    const profile = await services.google.oauthCallback(ctx);
    // TODO: 落库 / 建立登录态（session.login / jwt.signature / passport.setUserIdInToken）
    ctx.send(profile);
  },
});
