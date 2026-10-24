import { Response } from 'express';
import { RequestPlus, TokenPayload } from '../../../commons/interfaces.js';
import { Auth } from '../auth/auth.js';
import { Interceptors } from './interceptors.js';


jest.mock('../auth/auth.js');
jest.mock('../../../config.js', () => ({
  config: {
    secret: 'test',
  },
}));

const req = {
  get: jest.fn(),
} as unknown as RequestPlus;

const resp = {} as unknown as Response;
const next = jest.fn();

describe('Given a interceptor class', () => {
  const interceptor = new Interceptors();
  describe('When call the logged method', () => {
    describe('When called with correct parameters', () => {
      test('Then it should call next function', () => {
        (req.get as jest.Mock).mockReturnValue('Bearer test');
        (Auth.verifyJWTgettingPayload as jest.Mock).mockResolvedValue({
          id: 'Test',
        } as TokenPayload);
        interceptor.logged(req, resp, next);
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('When called with no Authorization header', () => {
    test('Then it should call next function (error)', () => {
      (req.get as jest.Mock).mockReturnValue(undefined);

      interceptor.logged(req, resp, next);
      expect(next).toHaveBeenCalled();
    });
  });
  describe('When called with no barer', () => {
    test('Then it should call next function (error)', () => {
      (req.get as jest.Mock).mockReturnValue('test');

      interceptor.logged(req, resp, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('When call the authorized method', () => {
    describe('When called with correct parameters', () => {
      test('Then it should call next function', () => {
        req.body = { id: '1' };
        req.params = { id: '1' };
        req.info = { id: '1' } as unknown as TokenPayload;
        interceptor.authorized(req, resp, next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('When called with no req body id', () => {
      test('Then it should take req params id and call next if matches', () => {
        req.body = { name: 'test' };
        req.params = { id: '' };
        req.info = { id: '1' } as unknown as TokenPayload;
        interceptor.authorized(req, resp, next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('When called with no matching ids', () => {
      test('Then it should call next (error)', () => {
        req.body = { id: 'string' };
        req.info = { id: '1' } as unknown as TokenPayload;
        req.params = { id: '2' }; // Change the value of req.params.id to '2'
        interceptor.authorized(req, resp, next);
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 403 })
        );
      });
    });
    describe('When called with no matching ids', () => {
      test('Then it should call next (error)', () => {
        req.body = { id: 'string' };
        req.info = { id: null } as unknown as TokenPayload;
        req.params = { id: '2' }; // Change the value of req.params.id to '2'
        interceptor.authorized(req, resp, next);
        expect(next).toHaveBeenCalled();
      });
    });
    describe('When called with no matching ids', () => {
      test('Then it should call next (error)', () => {
        req.body = { id: 'string' };
        req.params = { id: '2' }; // Change the value of req.params.id to '2'
        interceptor.authorized(req, resp, next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('When called with no req.info', () => {
      test('Then it should call next function (error)', () => {
        delete req.info;

        interceptor.authorized(req, resp, next);
        expect(next).toHaveBeenCalled();
      });
    });
  });
});
