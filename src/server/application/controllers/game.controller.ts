import GameCreator from '../../../games/application/gamecreator.js';
import GameDeleter from '../../../games/application/gamedeleter.js';
import GameFinder from '../../../games/application/gamefinder.js';
import GameSearcher from '../../../games/application/gamesearcher.js';
import GameUpdater from '../../../games/application/gameupdater.js';
import createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import GameFinderAll from '../../../games/application/gamefinderall.js';
import { HTTPError } from '../../../commons/error.js';
import { RequestPlus } from '../../../commons/interfaces.js';
import { pick } from '../../../commons/pick.js';
import UserFinder from '../../../user/application/userfinder.js';
import UserUpdater from '../../../user/application/userupdater.js';
import User from '../../../user/domain/user.model.js';
import {
  GAME_CATEGORIES,
  isGameCategory,
} from '../../../games/domain/game.model.js';

const invalidCategory = () =>
  new HTTPError(
    400,
    'Invalid category',
    `Category must be one of: ${GAME_CATEGORIES.join(', ')}`
  );

/** Mongoose document (or plain object) -> JSON shape used by GET: `id`, no `_id`/`__v`. */
const toGameJson = (data: unknown): Record<string, unknown> => {
  const doc = data as { toObject?: () => Record<string, unknown> };
  const plain =
    typeof doc?.toObject === 'function'
      ? doc.toObject()
      : { ...(data as Record<string, unknown>) };
  const { _id: rawId, __v: _version, ...rest } = plain;
  const id = rest.id ?? rawId;
  return { ...rest, id: id === undefined ? undefined : String(id) };
};

const EDITABLE_GAME_FIELDS = [
  'gameName',
  'category',
  'img',
  'releaseDate',
  'price',
  'description',
] as const;

const debug = createDebug('WOF: user controller');

export default class GameController {
  // eslint-disable-next-line max-params
  constructor(
    private gameCreator: GameCreator,
    private gameFinderAll: GameFinderAll,
    private gameFinder: GameFinder,
    private gameSearcher: GameSearcher,
    private gameUpdater: GameUpdater,
    private gameDeleter: GameDeleter,
    private userFinder: UserFinder,
    private userUpdate: UserUpdater
  ) {
    debug('Game controller instantiated');
  }

  private async assertOwner(gameId: string, userId?: string) {
    if (!userId) throw new HTTPError(498, 'Invalid token', 'Not found user id');
    const game = await this.gameFinder.execute(gameId);
    if (!game) throw new HTTPError(404, 'Not found', 'Game not found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const owner = game.owner as any;
    if (String(owner?._id ?? owner) !== userId)
      throw new HTTPError(403, 'Forbidden', 'Only the owner can modify a game');
  }

  async createGame(req: RequestPlus, res: Response, next: NextFunction) {
    debug('createGame');
    try {
      const userId = req.info?.id;
      if (!userId) throw new HTTPError(404, 'Not found', 'Not found user id');
      const actualUser: User | null = await this.userFinder.execute(userId);

      if (!actualUser) throw new HTTPError(404, 'Not found', 'Not found user');

      if (
        !req.body.gameName ||
        !req.body.category ||
        !req.body.img ||
        !req.body.releaseDate
      )
        throw new HTTPError(
          401,
          'Unauthorized',
          'Invalid Name, category, img or release date'
        );

      if (!isGameCategory(req.body.category)) throw invalidCategory();

      req.body.owner = actualUser;
      const data = await this.gameCreator.execute(req.body);
      actualUser.myGames.push(data);
      await this.userUpdate.execute(actualUser);
      res.status(200);
      // `data.owner` is the in-memory user document, whose myGames now
      // contains `data` (circular, not JSON-serializable): reply with the id.
      // Same shape as GET (`id`, no `_id`) so clients can link to it directly.
      res.json({
        results: [{ ...toGameJson(data), owner: userId }],
      });
    } catch (error) {
      next(error);
    }
  }

  async findGame(req: Request, res: Response, next: NextFunction) {
    try {
      debug('findGame');
      const { id } = req.params;
      const response = await this.gameFinder.execute(id);

      res.status(200);
      res.json({ results: [response] });
    } catch (error) {
      next(error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findAllGame(req: Request, res: Response, _next: NextFunction) {
    debug('findUser');
    const response = await this.gameFinderAll.execute();

    res.status(200);
    res.json({ results: [response] });
  }

  async searchGame(req: Request, res: Response, next: NextFunction) {
    try {
      debug('searchGame');
      if (!req.params.category)
        throw new HTTPError(404, 'Missing category', 'no category in the body');
      const response = await this.gameSearcher.execute({
        key: 'category',
        value: req.params.category,
      });

      res.status(200);
      res.json({ results: [response] });
    } catch (error) {
      next(error);
    }
  }

  async updateGame(req: RequestPlus, res: Response, next: NextFunction) {
    try {
      debug('updateGame');
      const { id } = req.params;
      const { body } = req;
      if (body.category !== undefined && !isGameCategory(body.category))
        throw invalidCategory();
      await this.assertOwner(id, req.info?.id);

      // Only listing fields are editable; id comes from the URL and the owner
      // never changes, whatever the body says.
      const newGame = {
        ...pick(body, EDITABLE_GAME_FIELDS),
        id,
      };

      await this.gameUpdater.execute(newGame);

      res.status(200);
      res.json({ ok: true, message: 'Game updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteGame(req: RequestPlus, res: Response, next: NextFunction) {
    try {
      debug('deleteGame');
      const { id } = req.params;
      await this.assertOwner(id, req.info?.id);

      await this.gameDeleter.execute(id);

      res.status(200);
      res.json({ ok: true, message: 'Game deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
