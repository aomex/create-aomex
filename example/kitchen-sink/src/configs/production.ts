import { baseConfig, type AppConfig, type EnvSecrets } from './shared';

/**
 * 密钥配置请放 .env.production，需在生产服务器手动创建文件。
 * 有条件请用 AWS Secret Manager 或者 Vault 存储密钥。
 */
const secrets = process.env as unknown as EnvSecrets;

export const production: AppConfig = {
  ...baseConfig,
  redis: {
    host: '',
    port: 6379,
    password: secrets.REDIS_PASSWORD || '',
    db: 0,
  },
  oauth: {
    google: {
      clientId: secrets.GOOGLE_CLIENT_ID || '',
      clientSecret: secrets.GOOGLE_CLIENT_SECRET || '',
    },
    //     microsoft: {
    //       clientId: secrets.MICROSOFT_CLIENT_ID || '',
    //       clientSecret: secrets.MICROSOFT_CLIENT_SECRET || '',
    //     },
    //     apple: {
    //       clientId: secrets.APPLE_CLIENT_ID || '',
    //       teamId: secrets.APPLE_TEAM_ID || '',
    //       keyId: secrets.APPLE_KEY_ID || '',
    //       privateKey: secrets.APPLE_PRIVATE_KEY || '',
    //     },
    github: {
      clientId: secrets.GITHUB_CLIENT_ID || '',
      clientSecret: secrets.GITHUB_CLIENT_SECRET || '',
    },
    //     discord: {
    //       clientId: secrets.DISCORD_CLIENT_ID || '',
    //       clientSecret: secrets.DISCORD_CLIENT_SECRET || '',
    //     },
    //     gitlab: {
    //       clientId: secrets.GITLAB_CLIENT_ID || '',
    //       clientSecret: secrets.GITLAB_CLIENT_SECRET || '',
    //     },
    //     linkedin: {
    //       clientId: secrets.LINKEDIN_CLIENT_ID || '',
    //       clientSecret: secrets.LINKEDIN_CLIENT_SECRET || '',
    //     },
    //     facebook: {
    //       clientId: secrets.FACEBOOK_CLIENT_ID || '',
    //       clientSecret: secrets.FACEBOOK_CLIENT_SECRET || '',
    //     },
    //     twitter: {
    //       clientId: secrets.TWITTER_CLIENT_ID || '',
    //       clientSecret: secrets.TWITTER_CLIENT_SECRET || '',
    //     },
    //     spotify: {
    //       clientId: secrets.SPOTIFY_CLIENT_ID || '',
    //       clientSecret: secrets.SPOTIFY_CLIENT_SECRET || '',
    //     },
  },
};
