import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const replaceVariables = async (
  filename: string,
  variables: Record<string, string>,
) => {
  const packageJSONFile = path.resolve(filename);
  let packageContent = await readFile(packageJSONFile, 'utf8');
  Object.entries(variables).forEach(([key, value]) => {
    packageContent = packageContent.replaceAll(`{{${key}}}`, value);
  });
  await writeFile(packageJSONFile, packageContent);
};
