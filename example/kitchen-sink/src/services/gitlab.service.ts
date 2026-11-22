// 解开本文件注释，并：pnpm add @aomex-contrib/oauth2-gitlab
// 同时解开 services/index、configs.oauth、.env、oauth2.router 中对应项
// import { Service } from '@aomex/common';
// import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';
// import type { WebContext } from '@aomex/web';
// import { GitLabOAuth2Client } from '@aomex-contrib/oauth2-gitlab';
// import { configs } from '@/configs';

// /**
//  * GitLab.com OAuth2 / OIDC 授权码客户端（PKCE；`@aomex-contrib`）。
//  * 回调后自行建立登录态（session / JWT / bearer）。
//  * @see https://github.com/aomex/aomex-contrib/tree/main/packages/oauth2-gitlab
//  */
// export default class GitlabService extends Service {
//   protected readonly oauth = new GitLabOAuth2Client({
//       clientId: configs.oauth.gitlab.clientId,
//       clientSecret: configs.oauth.gitlab.clientSecret,
//       redirectUri: (ctx) => `${ctx.request.origin}/oauth/gitlab/callback`,
//       store: new CacheRedisAdapter(configs.redis),
//     });

//   oauthRedirect(ctx: WebContext) {
//     return this.oauth.redirect(ctx);
//   }

//   oauthCallback(ctx: WebContext) {
//     return this.oauth.callback(ctx);
//   }
// }
