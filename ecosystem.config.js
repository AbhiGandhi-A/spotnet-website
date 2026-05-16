module.exports = {
  apps: [
    {
      name: 'spotnet-backend',
      script: 'npm',
      args: 'start',
      exec_mode: 'cluster',
      instances: 'max',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
    },
    {
      name: 'spotnet-workers',
      script: 'npm',
      args: 'run worker',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
    },
  ],
};
