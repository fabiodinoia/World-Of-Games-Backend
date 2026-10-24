import createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import { HTTPError } from '../../../commons/error.js';
import { RequestPlus, TokenPayload } from '../../../commons/interfaces.js';
import UserCreator from '../../../user/application/usercreator.js';
import UserDeleter from '../../../user/application/userdeleter.js';
import UserFinder from '../../../user/application/userfinder.js';
import UserSearcher from '../../../user/application/usersearcher.js';
import UserUpdater from '../../../user/application/userupdater.js';
import { Auth } from '../auth/auth.js';
import { UserRole } from '../../../user/domain/user.model.js';
import { pick } from '../../../commons/pick.js';
import { DEMO_USER } from '../../../seed/demo-data.js';

const EDITABLE_USER_FIELDS = [
  'name',
  'email',
  'password',
  'img',
  'address',
  'cart',
] as const;

const debug = createDebug('WOF: user controller');

export class UserController {
  // eslint-disable-next-line max-params
  constructor(
    private userCreator: UserCreator,
    private userFinder: UserFinder,
    private userSearcher: UserSearcher,
    private userUpdater: UserUpdater,
    private userDeleter: UserDeleter
  ) {
    debug('User controller instantiated...');
  }

  async findUser(req: Request, res: Response, next: NextFunction) {
    try {
      debug('findUser');
      const { id } = req.params;
      const response = await this.userFinder.execute(id);
      if (!response)
        throw new HTTPError(404, 'Not found', 'User not found');

      res.status(200);
      res.json({ results: [response] });
    } catch (error) {
      next(error);
    }
  }

  async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      debug('registerUser');
      const { body } = req;

      if (
        !req.body.email ||
        !req.body.password ||
        !req.body.name
      )
        throw new HTTPError(
          401,
          'Unauthorized',
          'Invalid Name, Email or password'
        );
      req.body.role = UserRole.USER as UserRole;
      req.body.password = await Auth.hash(req.body.password);

      req.body.cart = [];
      req.body.myGames = [];

      const data = await this.userCreator.execute(body);

      res.status(201);
      res.json({
        results: [data],
      });
    } catch (error) {
      next(error);
    }
  }

  async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      debug('loginUser');
      if (!req.body.email || !req.body.password)
        throw new HTTPError(401, 'Unauthorized', 'Invalid Email or password');

      const data = await this.userSearcher.execute({
        key: 'email',
        value: req.body.email,
      });

      if (!data.length)
        throw new HTTPError(401, 'Unauthorized', 'username not found');

      if (!(await Auth.compare(req.body.password, data[0].password)))
        throw new HTTPError(401, 'Unauthorized', 'Password not match');

      const payload: TokenPayload = {
        id: data[0].id,
        email: data[0].email,
        role: data[0].role,
      };

      const token = Auth.createJWT(payload);
      res.status(202);
      res.json({
        results: {
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: RequestPlus, res: Response, next: NextFunction) {
    try {
      debug('updateUser');
      const { id } = req.params;
      // Profile fields and the cart only: role and myGames are never
      // client-editable, and id comes from the URL.
      const changes: Record<string, unknown> = pick(
        req.body,
        EDITABLE_USER_FIELDS
      );
      // The shared demo account keeps its sign-in details for every visitor.
      if (req.info?.email === DEMO_USER.email) {
        delete changes.email;
        delete changes.password;
      }
      if (typeof changes.password === 'string')
        changes.password = await Auth.hash(changes.password);

      const newUser = {
        ...changes,
        id,
      };

      await this.userUpdater.execute(newUser);

      res.status(200);
      res.json({ ok: true, message: 'Game updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      debug('deleteUser');
      const { id } = req.params;

      await this.userDeleter.execute(id);

      res.status(204);
      res.json({ ok: true, message: 'Game updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
