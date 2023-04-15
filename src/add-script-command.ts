import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const addScriptCommand = async (key: string, command: string) => {
  const file = path.resolve('package.json');
  const str = await readFile(file, 'utf8');
  const json = JSON.parse(str) as { scripts: Record<string, string> };
  json.scripts[key] = command;
  await writeFile(file, JSON.stringify(json, null, 2));
};
