import { Service } from '@aomex/common';
import { cache } from '@/services/cache.service';

/** Bearer 策略会话：token → userId（见 auth.md.ts） */
export default class PassportService extends Service {
  private readonly userToken = cache.key('passport-user-token', 'v1');

  async getUserIdByToken(token: string, refreshTTL: boolean) {
    const key = this.userToken.keyHash(token);
    const userId = await cache.get<number>(key);
    if (!userId) return null;
    if (refreshTTL) {
      await cache.expire(key, '1 day');
    }
    return userId;
  }

  async setUserIdInToken(token: string, userId: number) {
    const key = this.userToken.keyHash(token);
    await cache.set(key, userId, '1 day');
  }

  async deleteUserToken(token: string) {
    const key = this.userToken.keyHash(token);
    await cache.delete(key);
  }
}
