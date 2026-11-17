import { Service } from '@aomex/common';
import { ArticleModel } from '@/models/article.model';

export default class ArticleService extends Service {
  async findArticles() {
    return await ArticleModel.find().sort({ created_at: -1 }).lean();
  }

  async findArticleById(id: string | number) {
    return await ArticleModel.findById(String(id)).lean();
  }

  async createArticle(data: {
    title: string;
    content: string;
    summary?: string;
    published?: boolean;
    tags?: string[];
  }) {
    const doc = await ArticleModel.create(data);
    return doc.toObject();
  }

  async updateArticle(
    id: string | number,
    data: {
      title?: string;
      content?: string;
      summary?: string;
      published?: boolean;
      tags?: string[];
    },
  ) {
    return await ArticleModel.findByIdAndUpdate(String(id), data, {
      new: true,
    }).lean();
  }

  async deleteArticle(id: string | number) {
    return await ArticleModel.findByIdAndDelete(String(id)).lean();
  }
}
