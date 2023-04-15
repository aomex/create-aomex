import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export const vscodeAddExtension = async (extension: string) => {
  const file = path.resolve('.vscode/extensions.json');
  const str = await readFile(file, 'utf8');
  const json = JSON.parse(str) as { recommendations: string[] };
  json.recommendations.push(extension);
  await writeFile(file, JSON.stringify(json, null, 2));
};

export const vscodeAddSetting = async (settings: Record<string, any>) => {
  const file = path.resolve('.vscode/settings.json');
  const str = await readFile(file, 'utf8');
  const json = JSON.parse(str) as Record<string, any>;
  Object.assign(json, settings);
  await writeFile(file, JSON.stringify(json, null, 2));
};
