import { select } from '@inquirer/prompts';
import { terminal } from './terminal';

export const selectNodeVersion = async (
  argv: Record<string, any>,
): Promise<string> => {
  let nodeVersion: string | undefined =
    typeof argv['node'] === 'string' ? argv['node'] : undefined;

  if (!nodeVersion) {
    const nodes = await promise;
    nodeVersion = await select({
      message: '请选择node.js稳定版本',
      choices: nodes.map((item) => ({
        name: `${item.version} ${terminal.style(['gray', 'dim'], item.date)}`,
        value: item.version,
        short: item.version,
      })),
      loop: false,
    });
  }

  return nodeVersion.replace(/^v/, '');
};

const fetchNodes = async () => {
  const response = await fetch(
    'https://nodejs.org/download/release/index.json',
  );
  if (!response.ok) {
    throw new Error(`无法获取 Node.js 版本列表：HTTP ${response.status}`);
  }
  const nodes = (await response.json()) as {
    version: string;
    lts: boolean | string;
    date: string;
  }[];

  return nodes
    .map((item) => ({
      ...item,
      versions: item.version.slice(1).split('.').map(Number) as [
        number,
        number,
        number,
      ],
    }))
    .filter((item) => {
      if (!item.lts) return false;
      // 生成项目依赖 @aomex/*，要求 Node >= 24
      return item.versions[0]! >= 24;
    });
};

const promise = fetchNodes();
