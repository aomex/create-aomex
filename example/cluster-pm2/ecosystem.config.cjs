module.exports = {
  apps: [
    {
      name: 'api',
      script: 'src/web.js',
      instances: 'max',
      exec_mode: 'cluster',
      // 勿与 clusterListen / 容器多副本叠用
      node_args: '--enable-source-maps --stack-trace-limit=30',
    },
  ],
};
