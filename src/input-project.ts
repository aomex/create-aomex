import { terminal } from './terminal';
import { input } from '@inquirer/prompts';
import { existsSync, readdirSync } from 'node:fs';
import path from 'path';

const PROJECT_NAME_RE = /^[a-z0-9_-]+$/;

const normalizeProjectName = (value: string) => {
  value = value.trim();
  if (!value.length) return '';
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/-+/g, '-');
};

export const inputProject = async (argv: Record<string, any>) => {
  let projectName: string = argv['project'];
  if (projectName) {
    projectName = normalizeProjectName(projectName);
    const available = validateProjectName(projectName);
    if (typeof available === 'string') {
      terminal.printError(available);
      process.exit(1);
    }
  } else {
    projectName = await input({
      message: '请输入项目',
      validate(value) {
        return validateProjectName(normalizeProjectName(value));
      },
      transformer(value) {
        return normalizeProjectName(value);
      },
    });
    projectName = normalizeProjectName(projectName);
  }

  return projectName;
};

const validateProjectName = (projectName: string): string | true => {
  if (!projectName) return '项目名不能为空';
  if (!PROJECT_NAME_RE.test(projectName)) {
    return '项目名只能包含小写字母、数字、连字符和下划线';
  }
  const targetDir = path.resolve(projectName);
  if (!existsSync(targetDir)) return true;
  if (!readdirSync(targetDir).length) return true;
  return `目录 "${targetDir}" 包含其它文件，请手动删除或选择新的项目名`;
};
