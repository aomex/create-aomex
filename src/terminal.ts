import { styleText } from 'node:util';

type Style = Parameters<typeof styleText>[0];

type TaskStatus =
  'success' | 'error' | 'skip' | 'warning' | 'loading' | 'prepare';

export interface TaskItem<Context extends object = object> {
  title: string;
  skip?: boolean | ((ctx: Context) => boolean | Promise<boolean>);
  task: (
    ctx: Context,
    task: {
      title: string;
      suffix: string;
      status: TaskStatus;
    },
  ) => Promise<unknown>;
}

const supportUnicode =
  process.platform !== 'win32' ||
  Boolean(process.env['WT_SESSION']) ||
  process.env['TERM_PROGRAM'] === 'vscode';

const symbols = {
  success: styleText('green', supportUnicode ? '✔' : '√'),
  error: styleText('red', supportUnicode ? '✖' : '×'),
  warning: styleText('yellow', supportUnicode ? '⚠' : '!'),
  info: styleText('blue', supportUnicode ? 'ℹ' : 'i'),
  skip: styleText('gray', supportUnicode ? '↓' : '-'),
  prepare: styleText(['gray', 'dim'], supportUnicode ? '◼' : '.'),
};

const loadingFrames = supportUnicode
  ? ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  : ['-', '\\', '|', '/'];

const createSession = () => {
  let lineCount = 0;
  let cacheText = '';
  let loadingFrameIndex = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let prevText = '';

  const write = (text: string) => {
    if (lineCount > 0) {
      process.stdout.write(`\u001B[${lineCount}A\u001B[0J`);
    }
    const lines = text.split('\n');
    lineCount = lines.length;
    process.stdout.write(`${text}\n`);
  };

  const replaceLoading = () =>
    cacheText.replaceAll('%loading%', loadingFrames[loadingFrameIndex]!);

  const reset = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    loadingFrameIndex = 0;
  };

  return {
    update: (text: string) => {
      if (prevText === text) return;
      prevText = text;
      cacheText = text
        .replaceAll('%success%', symbols.success)
        .replaceAll('%error%', symbols.error)
        .replaceAll('%warning%', symbols.warning)
        .replaceAll('%info%', symbols.info)
        .replaceAll('%skip%', symbols.skip)
        .replaceAll('%prepare%', symbols.prepare);
      write(replaceLoading());
      if (text.includes('%loading%')) {
        timer ??= setInterval(() => {
          loadingFrameIndex = (loadingFrameIndex + 1) % loadingFrames.length;
          write(replaceLoading());
        }, 80);
      } else {
        reset();
      }
    },
    commit: () => {
      reset();
      lineCount = 0;
    },
  };
};

export const terminal = {
  printError: (...messages: unknown[]) => {
    console.error(
      symbols.error,
      ...messages.map((message) => styleText('red', String(message))),
    );
  },

  style: (color: Style, string: string) => styleText(color, string),

  runTasks: async <Context extends object = object>(
    items: TaskItem<Context>[],
  ): Promise<{ error: Error | null; context: Context }> => {
    const log = createSession();
    const tasks = items.map((item) => ({
      ...item,
      suffix: '',
      status: 'prepare' as TaskStatus,
    }));

    const reRender = () => {
      log.update(
        tasks
          .map((task) => {
            const suffix =
              task.status === 'skip'
                ? styleText('gray', '[skipped]')
                : task.suffix;
            return `%${task.status}% ${task.title}${suffix ? ` ${suffix}` : ''}`;
          })
          .join('\n'),
      );
    };

    reRender();
    const timer = setInterval(reRender, 16);
    const ctx = {} as Context;

    try {
      for (const task of tasks) {
        const shouldSkip =
          typeof task.skip === 'function'
            ? await task.skip(ctx)
            : task.skip === true;
        if (shouldSkip) {
          task.status = 'skip';
          continue;
        }

        try {
          task.status = 'loading';
          let statusChanged = false;
          await task.task(ctx, {
            get status() {
              return task.status;
            },
            set status(status) {
              task.status = status;
              statusChanged = true;
            },
            get title() {
              return task.title;
            },
            set title(title) {
              task.title = title;
            },
            get suffix() {
              return task.suffix;
            },
            set suffix(suffix) {
              task.suffix = suffix;
            },
          });
          if (!statusChanged) task.status = 'success';
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e));
          task.status = 'error';
          task.suffix = styleText('red', err.message);
          return { error: err, context: ctx };
        }
      }
      return { error: null, context: ctx };
    } finally {
      clearInterval(timer);
      reRender();
      log.commit();
    }
  },
};
