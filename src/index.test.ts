import ExpressServer from './server/express.server';
import { config } from './config';

jest.mock('./server/express.server');

describe('Given the API entry point', () => {
  test('When it is loaded, then it wires both routers and starts on the configured port', async () => {
    await import('./index');
    const Server = ExpressServer as jest.MockedClass<typeof ExpressServer>;
    expect(Server).toHaveBeenCalledTimes(1);
    const routers = Server.mock.calls[0][0];
    expect(routers.map((r) => r.path)).toEqual(['/users', '/games']);
    expect(Server.mock.instances[0].start).toHaveBeenCalledWith(config.port);
  });
});
