import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path/posix';
import kebabCase from 'lodash.kebabcase';

export const updatePackageName = async (projectName: string) => {
  const packageJSONFile = path.resolve('package.json');
  let packageContent = await readFile(packageJSONFile, 'utf8');
  packageContent = packageContent.replace(
    'project-name',
    kebabCase(projectName),
  );
  await writeFile(packageJSONFile, packageContent);
};
