/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../server/infrastructures/db/db.connect');
jest.mock('./seed');

const flush = () => new Promise((resolve) => setImmediate(resolve));

// run.ts executes on import, so each test loads it fresh with its own mocks.
const runSeedCommand = async (configure: (deps: { dbConnect: jest.Mock; seed: jest.Mock }) => void) => {
  jest.resetModules();
  const mongoose = require('mongoose');
  jest.spyOn(mongoose, 'disconnect').mockResolvedValue(undefined);
  Object.defineProperty(mongoose.connection, 'db', {
    value: { databaseName: 'worldofgames' },
    configurable: true,
  });
  const { dbConnect } = require('../server/infrastructures/db/db.connect');
  const { seed } = require('./seed');
  configure({ dbConnect, seed });
  require('./run');
  await flush();
  return mongoose;
};

describe('Given the seed command', () => {
  let log: jest.SpyInstance;
  let error: jest.SpyInstance;
  let exit: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    exit = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  });
  afterEach(() => jest.restoreAllMocks());

  test('When seeding works, then it reports the count and disconnects', async () => {
    const mongoose = await runSeedCommand(({ dbConnect, seed }) => {
      dbConnect.mockResolvedValue(undefined);
      seed.mockResolvedValue({ games: [1, 2, 3] });
    });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('3 games into "worldofgames"'));
    expect(mongoose.disconnect).toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
  });

  test('When seeding fails, then it logs, disconnects and exits with 1', async () => {
    const boom = new Error('boom');
    const mongoose = await runSeedCommand(({ dbConnect }) => {
      dbConnect.mockRejectedValue(boom);
    });
    expect(error).toHaveBeenCalledWith(boom);
    expect(mongoose.disconnect).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });
});
