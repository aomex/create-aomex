import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path/posix';
import { glob } from 'glob';

export const copyTemplate = async (sourceDir: string) => {
  const files = await glob(path.join(sourceDir, '**', '*'), {
    nodir: true,
    dot: true,
  });

  await Promise.all(
    files.map(async (file) => {
      const relativePath = path.relative(sourceDir, file);
      const targetFile = path.resolve(relativePath);
      await mkdir(path.dirname(targetFile), { recursive: true });
      await copyFile(file, targetFile);
    }),
  );
};
