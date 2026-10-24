import { config } from './config.js';
import GameDeleter from './games/application/gamedeleter.js';
import GameFinder from './games/application/gamefinder.js';
import GameFinderAll from './games/application/gamefinderall.js';
import GameSearcher from './games/application/gamesearcher.js';
import GameUpdater from './games/application/gameupdater.js';
import GameCreator from './games/application/gamecreator.js';
import GameMongoRepo from './games/infrastructure/game.mono.repo.js';
import GameController from './server/application/controllers/game.controller.js';
import { UserController } from './server/application/controllers/user.controller.js';
import { GameModel } from './server/domain/game.schema.js';
import { UserModel } from './server/domain/user.schema.js';
import ExpressServer from './server/express.server.js';
import GameRouter from './server/infrastructures/routers/game.router/game.router.js';
import UserCreator from './user/application/usercreator.js';
import UserDeleter from './user/application/userdeleter.js';
import UserFinder from './user/application/userfinder.js';
import UserSearcher from './user/application/usersearcher.js';
import UserUpdater from './user/application/userupdater.js';
import UserMongoRepo from './user/infrastructure/user.mongo.repo.js';
import UserRouter from './server/infrastructures/routers/user.router/user.router.js';

const bootstrap = async () => {
  // User

  const userRepository = new UserMongoRepo(UserModel);

  const userSearcher = new UserSearcher(userRepository);
  const userFinders = new UserFinder(userRepository);
  const userCreator = new UserCreator(userRepository);
  const userUpdater = new UserUpdater(userRepository);
  const userDeleter = new UserDeleter(userRepository);
  const userController = new UserController(
    userCreator,
    userFinders,
    userSearcher,
    userUpdater,
    userDeleter
  );

  const userRouter = new UserRouter(userController);

  // Game

  const gameRepository = new GameMongoRepo(GameModel);

  const gameSearcher = new GameSearcher(gameRepository);
  const gameCreator = new GameCreator(gameRepository);
  const gameFinder = new GameFinder(gameRepository);
  const gameFinderAll = new GameFinderAll(gameRepository);
  const gameUpdater = new GameUpdater(gameRepository);
  const gameDeleter = new GameDeleter(gameRepository);
  const gameController = new GameController(
    gameCreator,
    gameFinderAll,
    gameFinder,
    gameSearcher,
    gameUpdater,
    gameDeleter,
    userFinders,
    userUpdater
  );

  const gameRouter = new GameRouter(gameController);

  // Server

  const server = new ExpressServer([userRouter, gameRouter]);

  server.start(config.port);
};

bootstrap();
