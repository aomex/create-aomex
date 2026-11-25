import { Service } from '@aomex/common';
import type { WebContext } from '@aomex/web';
import { GitHubOAuth2Client } from '@aomex-contrib/oauth2-github';
import { cache } from '@/services/cache.service';
import { configs } from '@/configs';

/**
 * GitHub OAuth2 / OIDC 授权码客户端（PKCE；`@aomex-contrib`）。
 * 回调后自行建立登录态（session / JWT / bearer）。
 * @see https://github.com/aomex/aomex-contrib/tree/main/packages/oauth2-github
 */
export default class GithubService extends Service {
  protected readonly oauth = new GitHubOAuth2Client({
    clientId: configs.oauth.github.clientId,
    clientSecret: configs.oauth.github.clientSecret,
    redirectUri: (ctx) => `${ctx.request.origin}/oauth/github/callback`,
    store: cache,
  });

  oauthRedirect(ctx: WebContext) {
    return this.oauth.redirect(ctx);
  }

  oauthCallback(ctx: WebContext) {
    return this.oauth.callback(ctx);
  }
}
