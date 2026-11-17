import { Service } from '@aomex/common';
import { prisma } from '@/services/prisma.service';
import type { Prisma } from '@/generated/prisma/client';

export default class ArticleService extends Service {
  async findArticles() {
    return await prisma.article.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findArticleById(id: number) {
    return await prisma.article.findUnique({
      where: {
        id,
      },
    });
  }

  async createArticle(data: Prisma.articleCreateInput) {
    return prisma.article.create({
      data,
    });
  }

  async updateArticle(id: number, data: Prisma.articleUpdateInput) {
    return await prisma.article.update({
      where: { id },
      data,
    });
  }

  async deleteArticle(id: number) {
    return await prisma.article.delete({
      where: { id },
    });
  }
}
