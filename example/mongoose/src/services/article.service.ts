import { Service } from '@aomex/common';
import { ArticleModel } from '@/models/article.model';

type ArticleInput = {
  title: string;
  content: string;
  summary?: string | null;
  published?: boolean;
  tags?: string[] | null;
};

type ArticlePatch = {
  title?: string;
  content?: string;
  summary?: string | null;
  published?: boolean;
  tags?: string[] | null;
};

const toArticle = (doc: {
  _id: { toString(): string };
  title: string;
  content: string;
  summary?: string | null;
  published: boolean;
  tags?: string[] | null;
}) => ({
  _id: String(doc._id),
  title: doc.title,
  content: doc.content,
  summary: doc.summary ?? null,
  published: doc.published,
  tags: doc.tags ?? null,
});

export default class ArticleService extends Service {
  async findArticles() {
    const docs = await ArticleModel.find().sort({ created_at: -1 }).lean();
    return docs.map(toArticle);
  }

  async findArticleById(id: string | number) {
    const doc = await ArticleModel.findById(String(id)).lean();
    return doc ? toArticle(doc) : null;
  }

  async createArticle(data: ArticleInput) {
    const doc = await ArticleModel.create(data);
    return toArticle(doc.toObject());
  }

  async updateArticle(id: string | number, data: ArticlePatch) {
    const doc = await ArticleModel.findByIdAndUpdate(String(id), data, {
      new: true,
    }).lean();
    return doc ? toArticle(doc) : null;
  }

  async deleteArticle(id: string | number) {
    return await ArticleModel.findByIdAndDelete(String(id)).lean();
  }
}
