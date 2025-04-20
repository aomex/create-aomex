import { terminal } from '@aomex/console';
import { select } from '@inquirer/prompts';

export const selectNodeVersion = async (argv: Record<string, any>) => {
  let nodeVersion: string = argv['node'];
  if (!nodeVersion) {
    const nodes = await promise;
    nodeVersion = await select({
      message: '请选择node.js稳定版本',
      choices: nodes.map((item) => {
        return {
          name: `${item.version} ${terminal.style(['gray', 'dim'], item.date)}`,
          value: item.version,
          short: item.version,
        };
      }),
      loop: false,
    });
  }

  return nodeVersion.replace(/^v/, '');
};

const fetchNodes = async () => {
  const response = await fetch(
    'https://nodejs.org/download/release/index.json',
  );
  const nodes = (await response.json()) as {
    version: string;
    lts: boolean;
    date: string;
  }[];

  return nodes
    .map((item) => {
      return {
        ...item,
        versions: item.version.slice(1).split('.').map(Number) as [
          number,
          number,
          number,
        ],
      };
    })
    .filter((item) => {
      if (!item.lts) return false;
      if (item.versions[0] === 22 && item.versions[1] >= 8) return true;
      if (item.versions[0] >= 24) return true;
      return false;
    });
};

const promise = fetchNodes();
