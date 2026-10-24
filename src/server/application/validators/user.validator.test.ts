import { NextFunction, Request, Response } from 'express';
import { HTTPError } from '../../../commons/error';
import { registerUserSchema, validateRegisterUser } from './user.validator';

describe('Given validateRegisterUser', () => {
  const res = {} as Response;
  const run = (body: unknown) => {
    const next = jest.fn() as unknown as NextFunction;
    validateRegisterUser({ body } as Request, res, next);
    return next as unknown as jest.Mock;
  };

  test('When the body is valid, then it calls next with no error', () => {
    const next = run({ name: 'Ana', email: 'ana@test.it', password: 'Password1!' });
    expect(next).toHaveBeenCalledWith();
  });

  test('When img is an empty string, then it is dropped; a real img is kept', () => {
    expect(registerUserSchema.parse({ name: 'A', email: 'a@b.it', password: 'Password1!', img: '' }).img).toBeUndefined();
    expect(registerUserSchema.parse({ name: 'A', email: 'a@b.it', password: 'Password1!', img: 'x.png' }).img).toBe('x.png');
  });

  test('When the body is invalid, then it forwards a 400', () => {
    const next = run({ email: 'not-an-email' });
    expect(next.mock.calls[0][0]).toBeInstanceOf(HTTPError);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  test('When parsing fails for another reason, then it forwards that error unchanged', () => {
    const boom = new Error('boom');
    jest.spyOn(registerUserSchema, 'parse').mockImplementationOnce(() => {
      throw boom;
    });
    const next = run({});
    expect(next).toHaveBeenCalledWith(boom);
  });
});
