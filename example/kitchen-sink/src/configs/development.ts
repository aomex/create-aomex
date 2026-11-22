import { baseConfig, type EnvSecrets, type AppConfig } from './shared';

/**
 * 密钥配置请放 .env
 */
const secrets = process.env as unknown as EnvSecrets;

export const development: AppConfig = {
  ...baseConfig,
  redis: {
    host: 'localhost',
    port: 6379,
    password: secrets.REDIS_PASSWORD || 'abcde',
    db: 0,
  },
  oauth: {
    google: {
      clientId: secrets.GOOGLE_CLIENT_ID || 'change-me',
      clientSecret: secrets.GOOGLE_CLIENT_SECRET || 'change-me',
    },
    //     microsoft: {
    //       clientId: secrets.MICROSOFT_CLIENT_ID || 'change-me',
    //       clientSecret: secrets.MICROSOFT_CLIENT_SECRET || 'change-me',
    //     },
    //     apple: {
    //       clientId: secrets.APPLE_CLIENT_ID || 'change-me',
    //       teamId: secrets.APPLE_TEAM_ID || 'change-me',
    //       keyId: secrets.APPLE_KEY_ID || 'change-me',
    //       privateKey: secrets.APPLE_PRIVATE_KEY || 'change-me',
    //     },
    github: {
      clientId: secrets.GITHUB_CLIENT_ID || 'change-me',
      clientSecret: secrets.GITHUB_CLIENT_SECRET || 'change-me',
    },
    //     discord: {
    //       clientId: secrets.DISCORD_CLIENT_ID || 'change-me',
    //       clientSecret: secrets.DISCORD_CLIENT_SECRET || 'change-me',
    //     },
    //     gitlab: {
    //       clientId: secrets.GITLAB_CLIENT_ID || 'change-me',
    //       clientSecret: secrets.GITLAB_CLIENT_SECRET || 'change-me',
    //     },
    //     linkedin: {
    //       clientId: secrets.LINKEDIN_CLIENT_ID || 'change-me',
    //       clientSecret: secrets.LINKEDIN_CLIENT_SECRET || 'change-me',
    //     },
    //     facebook: {
    //       clientId: secrets.FACEBOOK_CLIENT_ID || 'change-me',
    //       clientSecret: secrets.FACEBOOK_CLIENT_SECRET || 'change-me',
    //     },
    //     twitter: {
    //       clientId: secrets.TWITTER_CLIENT_ID || 'change-me',
    //       clientSecret: secrets.TWITTER_CLIENT_SECRET || 'change-me',
    //     },
    //     spotify: {
    //       clientId: secrets.SPOTIFY_CLIENT_ID || 'change-me',
    //       clientSecret: secrets.SPOTIFY_CLIENT_SECRET || 'change-me',
    //     },
  },
};
