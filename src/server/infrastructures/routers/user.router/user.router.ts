/* eslint-disable new-cap */
import { Router } from 'express';
import { UserController } from '../../../application/controllers/user.controller.js';
import { Interceptors } from '../../../application/interceptors/interceptors.js';
import {
  authLimiter,
  writeLimiter,
} from '../../../application/interceptors/rate-limit.js';
import ServerRouter from '../../../Server.router.interface.js';
import { validateRegisterUser } from '../../../application/validators/user.validator.js';

export default class UserRouter implements ServerRouter {
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  path: string = '/users';
  interceptor: Interceptors = new Interceptors();
  router: Router = Router();

  constructor(private controller: UserController) {
    this.registerControllers();
  }

  registerControllers(): void {
    this.router.post(
      '/register',
      authLimiter,
      validateRegisterUser,
      this.controller.registerUser.bind(this.controller)
    );
    this.router.post(
      '/login',
      authLimiter,
      this.controller.loginUser.bind(this.controller)
    );
    this.router.get(
      '/:id',
      this.interceptor.logged,
      this.interceptor.authorized,
      this.controller.findUser.bind(this.controller)
    );
    this.router.put(
      '/:id',
      writeLimiter,
      this.interceptor.logged,
      this.interceptor.authorized,
      this.controller.updateUser.bind(this.controller)
    );
    this.router.delete(
      '/:id',
      writeLimiter,
      this.interceptor.logged,
      this.interceptor.authorized,
      this.controller.deleteUser.bind(this.controller)
    );
  }
}
