import Ora from 'ora';
import chalk from 'chalk';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';

const exec = promisify(childProcess.exec);
export const ora = Ora();

export const execute = async (
  msg: string,
  callback: (execute: typeof exec) => Promise<any>,
) => {
  ora.suffixText = '';
  ora.start(msg);
  try {
    const startTime = Date.now();
    await callback(exec);
    ora.suffixText = chalk.gray(`[${(Date.now() - startTime) / 1000}s]`);
    ora.succeed();
  } catch (e) {
    ora.suffixText = chalk.red(`[${(e as Error).message}]`);
    ora.fail();
    process.exit(1);
  }
};
