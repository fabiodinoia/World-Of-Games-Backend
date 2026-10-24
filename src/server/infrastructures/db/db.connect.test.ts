import { dbConnect } from './db.connect.js';
import mongoose from 'mongoose';
import { config } from '../../../config.js';

describe('Given the dbconnect function', () => {
  describe('When called in test environment', () => {
    test('Then it should call the mongoose.connect', async () => {
      const result = await dbConnect();
      expect(typeof result).toBe(typeof mongoose);
      expect(mongoose.connection.db.databaseName).toContain('Testing');
      mongoose.disconnect();
    });
  });

  describe('When called in not test environment', () => {
    test('Then it should call the mongoose.connect', async () => {
      const result = await dbConnect('env');
      expect(typeof result).toBe(typeof mongoose);
      expect(mongoose.connection.db.databaseName).not.toContain('Testing');
      mongoose.disconnect();
    });
  });

  describe('When MONGODB_URI is not set', () => {
    const saved = { uri: process.env.MONGODB_URI, ...config };
    afterEach(() => {
      process.env.MONGODB_URI = saved.uri;
      Object.assign(config, { user: saved.user, pass: saved.pass, cluster: saved.cluster });
      jest.restoreAllMocks();
    });

    test('Then it builds an encoded mongodb+srv URI from the legacy parts', async () => {
      delete process.env.MONGODB_URI;
      Object.assign(config, { user: 'u@x', pass: 'p/w', cluster: 'c.mongodb.net' });
      const connect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      await dbConnect('test');
      expect(connect).toHaveBeenCalledWith(
        'mongodb+srv://u%40x:p%2Fw@c.mongodb.net/?retryWrites=true&w=majority',
        expect.objectContaining({ dbName: expect.stringContaining('_Testing') })
      );
    });

    test('Then missing legacy parts become empty strings', async () => {
      delete process.env.MONGODB_URI;
      Object.assign(config, { user: undefined, pass: undefined, cluster: 'c' });
      const connect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      await dbConnect('test');
      expect(connect.mock.calls[0][0]).toBe('mongodb+srv://:@c/?retryWrites=true&w=majority');
    });
  });
});
