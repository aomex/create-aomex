import { terminal } from '@aomex/console';
import { input } from '@inquirer/prompts';
import { existsSync, readdirSync } from 'node:fs';
import sanitize from 'sanitize-filename';
import path from 'path';

const kebabCase = (value: string) => {
  value = sanitize(value);
  if (!value.length) return '';
  value = value[0]!.toLowerCase() + value.slice(1);
  return value
    .replace(/[A-Z]/g, (i) => '-' + i.toLowerCase())
    .replace(/_/g, '-')
    .replace(/-+/g, '-');
};

export const inputProject = async (argv: Record<string, any>) => {
  let projectName: string = argv['project'];
  if (projectName) {
    projectName = kebabCase(projectName);
    const available = isProjectDirAvailable(projectName);
    if (typeof available === 'string') {
      terminal.printError(available);
      process.exit(1);
    }
  } else {
    projectName = await input({
      message: '请输入项目',
      validate(value) {
        return isProjectDirAvailable(value);
      },
      transformer(value) {
        return kebabCase(value);
      },
    });
    projectName = kebabCase(projectName);
  }

  return projectName;
};

const isProjectDirAvailable = (projectName: string): string | true => {
  projectName = projectName.trim();
  if (!projectName.trim()) return '项目名不能为空';
  const targetDir = path.resolve(projectName);
  if (!existsSync(targetDir)) return true;
  if (!readdirSync(targetDir).length) return true;
  return `目录 "${targetDir}" 包含其它文件，请手动删除或选择新的项目名`;
};
