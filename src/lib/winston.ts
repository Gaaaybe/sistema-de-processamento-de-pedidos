import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "@/env";

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    audit: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    audit: 'blue',
    debug: 'white'
};

winston.addColors(colors);

const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
);

const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const transports: winston.transport[] = [];

if (env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            level: 'debug',
            format: devFormat
        })
    );
}

if (env.NODE_ENV !== 'test') {
    transports.push(
        new DailyRotateFile({
            filename: 'logs/app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'info',
            format: prodFormat
        })
    );

    transports.push(
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error',
            format: prodFormat
        })
    );

    transports.push(
        new DailyRotateFile({
            filename: 'logs/audit-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '90d',
            level: 'audit',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
            )
        })
    );
}

export const logger = winston.createLogger({
    levels,
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports,
    exitOnError: false,
});

export const auditLogger = {
  log: (action: string, details: any) => {
    logger.log('audit', action, details);
  }
};