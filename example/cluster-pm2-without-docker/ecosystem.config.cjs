module.exports = {
  apps: [
    {
      name: 'api',
      script: 'src/web.ts',
      instances: 'max',
      exec_mode: 'cluster',
      // 勿与 clusterListen / 容器多副本叠用
      node_args: '--import tsx/esm --stack-trace-limit=30',
    },
  ],
};
