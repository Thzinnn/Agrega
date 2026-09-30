import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

// Security middlewares
app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  /^https:\/\/.*\.pages\.dev$/
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.some(regex => typeof regex === 'string' ? regex === origin : regex.test(origin))) {
        return callback(null, true);
      }
      
      return callback(new Error('Acesso negado pela política de CORS'), false);
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Application routes
app.use(routes);

// Central error handler
app.use(errorHandler);
