import mongoose from 'mongoose';
import request from 'supertest';
import ExpressServer from './express.server';
import { dbConnect } from './infrastructures/db/db.connect';

jest.mock('./infrastructures/db/db.connect');

describe('Given the Express server', () => {
  test('When GET / is requested, then it lists the available routes', async () => {
    const res = await request(new ExpressServer([]).app).get('/').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('When started, then it connects to the database and listens on the port', async () => {
    Object.defineProperty(mongoose.connection, 'db', {
      value: { databaseName: 'worldofgames' },
      configurable: true,
    });
    (dbConnect as jest.Mock).mockResolvedValue(mongoose);
    const server = new ExpressServer([]);
    const listen = jest
      .spyOn(server.app, 'listen')
      .mockImplementation(((_port: number, cb: () => void) => {
        cb();
        return {} as never;
      }) as never);
    server.start(4999);
    await new Promise((resolve) => setImmediate(resolve));
    expect(dbConnect).toHaveBeenCalled();
    expect(listen).toHaveBeenCalledWith(4999, expect.any(Function));
  });

  test('When TRUST_PROXY is set, then it trusts the first proxy (real client IPs)', () => {
    process.env.TRUST_PROXY = '1';
    try {
      expect(new ExpressServer([]).app.get('trust proxy')).toBe(1);
    } finally {
      delete process.env.TRUST_PROXY;
    }
    expect(new ExpressServer([]).app.get('trust proxy')).toBeFalsy();
  });
});
