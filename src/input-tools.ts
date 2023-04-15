import inquirer from 'inquirer';

const allTools = <const>['prettier', 'commitlint'];

export type Tool = (typeof allTools)[number];

export const inputTools = async (argv: Record<string, any>) => {
  if (argv['tools'] === false) return [];
  if (argv['tools']) {
    return [].concat(argv['tools']);
  }

  const { tools } = await inquirer.prompt<{ tools: Tool[] }>({
    name: 'tools',
    message: 'Additional and useful tools',
    type: 'checkbox',
    choices: [
      {
        checked: true,
        name: 'Prettier (Format code)',
        value: allTools[0],
      },
      {
        checked: true,
        name: 'Commitlint (Validate commit message)',
        value: allTools[1],
      },
    ],
  });
  return tools;
};
