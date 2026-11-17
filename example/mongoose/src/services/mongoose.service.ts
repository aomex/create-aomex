import { registerLifecycle } from '@aomex/common';
import mongoose from 'mongoose';

/**
 * 管理 Mongoose 连接生命周期；业务代码仍可 `import { mongoose } from '@/services/mongoose.service'`。
 */
await registerLifecycle({
  onInit: async () => {
    const uri = process.env['DATABASE_URL'];
    if (!uri) throw new Error('DATABASE_URL is required');
    await mongoose.connect(uri);
  },
  onDestroy: () => mongoose.disconnect(),
});

export { mongoose };
