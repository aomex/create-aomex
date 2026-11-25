import { Service } from '@aomex/common';
import type { WebContext } from '@aomex/web';
import { GoogleOAuth2Client } from '@aomex-contrib/oauth2-google';
import { cache } from '@/services/cache.service';
import { configs } from '@/configs';

/**
 * Google（OIDC 整页 redirect） OAuth2 / OIDC 授权码客户端（PKCE；`@aomex-contrib`）。
 * 回调后自行建立登录态（session / JWT / bearer）。
 * @see https://github.com/aomex/aomex-contrib/tree/main/packages/oauth2-google
 */
export default class GoogleService extends Service {
  protected readonly oauth = new GoogleOAuth2Client({
    clientId: configs.oauth.google.clientId,
    clientSecret: configs.oauth.google.clientSecret,
    redirectUri: (ctx) => `${ctx.request.origin}/oauth/google/callback`,
    store: cache,
  });

  oauthRedirect(ctx: WebContext) {
    return this.oauth.redirect(ctx);
  }

  oauthCallback(ctx: WebContext) {
    return this.oauth.callback(ctx);
  }
}
