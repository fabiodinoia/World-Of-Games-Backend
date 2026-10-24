import { NextFunction, Request, Response } from 'express';
import { RequestPlus, TokenPayload } from '../../../commons/interfaces.js';
import UserCreator from '../../../user/application/usercreator.js';
import UserDeleter from '../../../user/application/userdeleter.js';
import UserFinder from '../../../user/application/userfinder.js';
import UserSearcher from '../../../user/application/usersearcher.js';
import UserUpdater from '../../../user/application/userupdater.js';
import UserRepository from '../../../user/domain/user.model.repo.js';
import { Auth } from '../auth/auth.js';
import { UserController } from './user.controller.js';

jest.mock('../auth/auth.js');
jest.mock('../../../config.js', () => ({
  _dirname: 'test',
  config: {
    secret: 'test',
  },
}));

const res = {
  json: jest.fn(),
  status: jest.fn(),
} as unknown as Response;

const next = jest.fn() as unknown as NextFunction;

const pass = 'test1';

const mockRepo = {
  create: jest.fn(),
  search: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as UserRepository;

const mockuserCreator = new UserCreator(mockRepo);
const mockuserSearcher = new UserSearcher(mockRepo);
const mockuserFinder = new UserFinder(mockRepo);
const mockuserUpdate = new UserUpdater(mockRepo);
const mockuserDeleter = new UserDeleter(mockRepo);

describe('Given userController class', () => {
  const controller = new UserController(
    mockuserCreator,
    mockuserFinder,
    mockuserSearcher,
    mockuserUpdate,
    mockuserDeleter
  );
  describe('When it is instanced', () => {
    test('Then it should call the userController', () => {
      expect(controller).toBeInstanceOf(UserController);
    });
  });

  describe('When findUser method is called', () => {
    test('Then if the user info is completed it should return the status and json', async () => {
      const req = {
        params: {
          id: '1',
        },
      } as unknown as Request;
      (mockRepo.find as jest.Mock).mockResolvedValueOnce({ id: '1' });

      await controller.findUser(req, res, next);
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
    test('Then if the user does not exist it should call next with a 404 HTTPError', async () => {
      const req = { params: { id: '1' } } as unknown as Request;
      (mockRepo.find as jest.Mock).mockResolvedValueOnce(null);
      const localNext = jest.fn();

      await controller.findUser(req, res, localNext);
      expect(localNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
    });
    test('Then if the user info is INcompleted it should return next', async () => {
      const req = {} as unknown as Request;

      await controller.findUser(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('When registerUser method is called', () => {
    test('Then if the user information is completed, it should return the resp.satus and resp.json', async () => {
      const req = {
        body: {
          name: 'test',
          email: 'test',
          password: pass,
          img: 'test',
        },
      } as unknown as Request;

      await controller.registerUser(req, res, next);
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('Then if user information in the body, has not user name, it should be catch the error and next function have been called', async () => {
      const req = {
        body: {
          password: pass,
        },
      } as unknown as Request;

      await controller.registerUser(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('When loginUser method is called', () => {
    test('Then if the user information is completed, it should return the resp.status and resp.json', async () => {
      const req = {
        body: {
          email: 'test',
          password: pass,
        },
      } as unknown as Request;

      (mockRepo.search as jest.Mock).mockResolvedValue(['test']);

      Auth.compare = jest.fn().mockResolvedValue(true);

      await controller.loginUser(req, res, next);
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('Then if the user information has not email, it should be catch the error and next function have been called', async () => {
      const req = {
        body: {
          password: pass,
        },
      } as unknown as Request;

      await controller.loginUser(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('Then if the user information has not password, it should be catch the error and next function have been called', async () => {
      const req = {
        body: {
          email: 'test',
        },
      } as unknown as Request;

      await controller.loginUser(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('Then if the user information is complete but the search method return an empty array, it should be catch the error and next function have been called', async () => {
      const req = {
        body: {
          email: 'test',
          password: pass,
        },
      } as unknown as Request;

      (mockRepo.search as jest.Mock).mockResolvedValue([]);

      await controller.loginUser(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('Then if the user information is complete but the compare method of Auth return false, it should be catch the error and next function have been called', async () => {
      const req = {
        body: {
          email: 'test',
          password: pass,
        },
      } as unknown as Request;

      (mockRepo.search as jest.Mock).mockResolvedValue(['test']);

      Auth.compare = jest.fn().mockResolvedValue(false);

      await controller.loginUser(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('When call the updateUser method', () => {
    describe('When all params are correct', () => {
      test('Then it should call resp.json', async () => {
        const req = {
          body: { name: 'test', email: 'Test', password: pass },
          info: { id: '1' },
          params: { id: '1' },
        } as unknown as RequestPlus;
        (mockRepo.update as jest.Mock).mockResolvedValue({ id: '1' });
        await controller.updateUser(req, res, next);
        expect(res.json).toHaveBeenCalled();
      });
    });

    describe('When updateUser fails', () => {
      test('Then it should call next', async () => {
        const req = {
          body: { name: 'test', email: 'Test', password: pass },
          info: { id: '1' },
        } as unknown as RequestPlus;
        (mockRepo.find as jest.Mock).mockResolvedValue(undefined);

        await controller.updateUser(req, res, next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('When there is no req.info.id', () => {
      test('Then it should call next', async () => {
        const req = {
          body: { name: 'test', email: 'Test', password: pass },
          info: { id: '1' },
        } as unknown as RequestPlus;
        req.info = undefined as unknown as TokenPayload;
        await controller.updateUser(req, res, next);
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('When deleteUser method is called', () => {
    test('Then if the id is found it should respond with status', async () => {
      const req = {
        body: { name: 'test', email: 'Test', password: pass },
        info: { id: '1' },
        params: { id: '1' },
      } as unknown as RequestPlus;

      (mockRepo.delete as jest.Mock).mockResolvedValue({ id: '1' });
      await controller.deleteUser(req, res, next);
      expect(res.status).toHaveBeenCalled();
    });
  });
});
