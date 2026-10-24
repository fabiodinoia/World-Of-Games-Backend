import express, { Express, NextFunction, Request, Response } from 'express';
import { CustomError } from '../commons/interfaces.js';
import { dbConnect } from './infrastructures/db/db.connect.js';
import ServerRouter from './Server.router.interface.js';
import createDebug from 'debug';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '../config.js';

const routes = [
  { endpoint: 'users/register', method: 'POST' },
  { endpoint: 'users/login', method: 'POST' },
  { endpoint: '/users/:userId', method: 'GET' },
  { endpoint: '/users/:userId', method: 'PUT' },
  { endpoint: '/users/:userId', method: 'DELETE' },
  { endpoint: '/health', method: 'GET' },
  { endpoint: '/games', method: 'GET' },
  { endpoint: '/games/:id', method: 'GET' },
  { endpoint: '/games', method: 'POST' },
  { endpoint: '/games/:id', method: 'PUT' },
  { endpoint: '/games/:id', method: 'DELETE' },
];

const debug = createDebug('WOG: express server');

export default class ExpressServer {
  app: Express;

  constructor(private routers: ServerRouter[]) {
    this.app = express();
    this.config();
    this.routes();
  }

  config(): void {
    // Needed behind a proxy (Render, Railway, Fly...) so rate limiting sees real IPs.
    if (process.env.TRUST_PROXY) this.app.set('trust proxy', 1);
    this.app.disable('x-powered-by');
    this.app.use(helmet());
    this.app.use(cors({ origin: config.corsOrigins }));
    this.app.use(express.json({ limit: '100kb' }));
  }

  routes(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.app.get('/', (req, res, _next) => {
      res.json(routes);
    });
    this.app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', uptime: process.uptime() });
    });
    this.routers.forEach((router) => {
      this.app.use(router.path, router.router);
    });
    // Minimal error mapper: HTTPError carries `statusCode`; anything else is a 500.
    this.app.use(
      (
        err: Partial<CustomError> & { status?: number },
        _req: Request,
        res: Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _next: NextFunction
      ) => {
        // body-parser errors use `status`; keep their 4xx instead of masking as 500.
        const status = err.statusCode ?? err.status ?? 500;
        res.status(status).json({
          error: err.statusMessage ?? 'Internal Server Error',
        });
      }
    );
  }

  start(port: number): void {
    dbConnect().then((mongoose) => {
      this.app.listen(port, () => {
        debug(
          `Server running on post ${port}`,
          mongoose.connection.db.databaseName
        );
      });
    });
  }
}
