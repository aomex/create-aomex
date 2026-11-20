import { Auth, AuthError } from '@aomex/auth';

/**
 * 尚未启用鉴权策略。需要时在脚手架中重新选择，或自行往 `strategies` 添加策略。
 * 路由用法：`auth.authenticate('bearer' | 'jwt' | 'apiKey' | 'session')`
 */
export const auth = new Auth({
  strategies: {},
});

export { AuthError };
