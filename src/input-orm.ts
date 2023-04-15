import inquirer from 'inquirer';

const allOrmFrameworks = <const>['prisma', '-'];

export type Orm = typeof allOrmFrameworks[number];

export const inputOrm = async (argv: Record<string, any>): Promise<Orm> => {
  const argvOrm: Orm | false = argv['orm'];
  if (argvOrm === false) {
    return allOrmFrameworks[1];
  }
  if (typeof argvOrm === 'string' && allOrmFrameworks.includes(argvOrm)) {
    return argvOrm;
  }

  const { orm } = await inquirer.prompt<{ orm: Orm }>({
    name: 'orm',
    message: 'Select orm',
    type: 'list',
    default: allOrmFrameworks[0],
    choices: [
      {
        name: 'Prisma (Support: mysql/mongoDB/postgresql/...)',
        value: allOrmFrameworks[0],
      },
      {
        name: 'None',
        value: allOrmFrameworks[1],
      },
    ],
  });
  return orm;
};
