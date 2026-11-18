/**
 * 解析 Node.js 版本：默认取最新 LTS（稳定版）；可用 `--node` 覆盖。
 */
export const selectNodeVersion = async (
  argv: Record<string, any>,
): Promise<string> => {
  const fromArg = argv['node'];
  if (typeof fromArg === 'string' && fromArg.trim()) {
    return fromArg.trim().replace(/^v/, '');
  }

  const nodes = await fetchNodes();
  const latest = nodes[0];
  if (!latest) {
    throw new Error('无法获取 Node.js 最新稳定版');
  }
  return latest.version.replace(/^v/, '');
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

  // index.json 按版本新→旧排列；取最新 LTS 且 major >= 24
  return nodes.filter((item) => {
    if (!item.lts) return false;
    const major = Number(item.version.slice(1).split('.')[0]);
    return major >= 24;
  });
};
