import path from 'path';
import pino from 'pino';

const ENV = process.env.NODE_ENV || 'development';
const DEV_SYNC = true;

const pinoConfig = {
  development: {
    level: 'debug',
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          level: 'debug',
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'SYS:standard',
            sync: DEV_SYNC,
          },
        },
      ],
    },
  },
  production: {
    level: 'info',
    transport: {
      targets: [
        {
          target: 'pino/file',
          level: 'info',
          options: {
            destination: path.join('logs', 'info.log'),
            mkdir: true,
            sync: false,
          },
        },
        {
          target: 'pino/file',
          level: 'error',
          options: {
            destination: path.join('logs', 'error.log'),
            mkdir: true,
            sync: false,
          },
        },
      ],
    },
    base: {
      env: process.env.NODE_ENV,
    },
  },
};

const logger = pino(pinoConfig[ENV]);

export default logger;
