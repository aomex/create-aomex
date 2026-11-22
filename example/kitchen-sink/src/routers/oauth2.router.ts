import { Router } from '@aomex/web';
import { services } from '@/services';

/**
 * OAuth2 / OIDC 授权码登录。
 * 未启用的厂商路由以注释保留；解开后安装对应 `@aomex-contrib/oauth2-*`，并启用 Service / configs / .env。
 */
export const router = new Router({ prefix: '/oauth' });

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
    // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
    ctx.send(profile);
  },
});

// /** Microsoft / Entra ID（OIDC） — pnpm add @aomex-contrib/oauth2-microsoft */
// router.get('/microsoft', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     await services.microsoft.oauthRedirect(ctx);
//   },
// });

// router.get('/microsoft/callback', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     const profile = await services.microsoft.oauthCallback(ctx);
//     // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
//     ctx.send(profile);
//   },
// });

// /** Apple（Sign in with Apple） — pnpm add @aomex-contrib/oauth2-apple */
// router.get('/apple', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     await services.apple.oauthRedirect(ctx);
//   },
// });

// router.post('/apple/callback', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     const profile = await services.apple.oauthCallback(ctx);
//     // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
//     ctx.send(profile);
//   },
// });

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
    // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
    ctx.send(profile);
  },
});

// /** Discord — pnpm add @aomex-contrib/oauth2-discord */
// router.get('/discord', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     await services.discord.oauthRedirect(ctx);
//   },
// });

// router.get('/discord/callback', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     const profile = await services.discord.oauthCallback(ctx);
//     // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
//     ctx.send(profile);
//   },
// });

// /** GitLab.com — pnpm add @aomex-contrib/oauth2-gitlab */
// router.get('/gitlab', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     await services.gitlab.oauthRedirect(ctx);
//   },
// });

// router.get('/gitlab/callback', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     const profile = await services.gitlab.oauthCallback(ctx);
//     // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
//     ctx.send(profile);
//   },
// });

// /** LinkedIn — pnpm add @aomex-contrib/oauth2-linkedin */
// router.get('/linkedin', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     await services.linkedin.oauthRedirect(ctx);
//   },
// });

// router.get('/linkedin/callback', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     const profile = await services.linkedin.oauthCallback(ctx);
//     // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
//     ctx.send(profile);
//   },
// });

// /** Facebook — pnpm add @aomex-contrib/oauth2-facebook */
// router.get('/facebook', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     await services.facebook.oauthRedirect(ctx);
//   },
// });

// router.get('/facebook/callback', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     const profile = await services.facebook.oauthCallback(ctx);
//     // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
//     ctx.send(profile);
//   },
// });

// /** Twitter / X — pnpm add @aomex-contrib/oauth2-twitter */
// router.get('/twitter', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     await services.twitter.oauthRedirect(ctx);
//   },
// });

// router.get('/twitter/callback', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     const profile = await services.twitter.oauthCallback(ctx);
//     // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
//     ctx.send(profile);
//   },
// });

// /** Spotify — pnpm add @aomex-contrib/oauth2-spotify */
// router.get('/spotify', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     await services.spotify.oauthRedirect(ctx);
//   },
// });

// router.get('/spotify/callback', {
//   docs: { showInOpenapi: false },
//   action: async (ctx) => {
//     const profile = await services.spotify.oauthCallback(ctx);
//     // TODO: 落库 / 建立登录态（session.login / jwt.signature / bearer 写 cache）
//     ctx.send(profile);
//   },
// });
