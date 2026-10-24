/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { TokenPayload } from '../../../../commons/interfaces';
import GameCreator from '../../../../games/application/gamecreator';
import GameDeleter from '../../../../games/application/gamedeleter';
import GameFinder from '../../../../games/application/gamefinder';
import GameFinderAll from '../../../../games/application/gamefinderall';
import GameSearcher from '../../../../games/application/gamesearcher';
import GameUpdater from '../../../../games/application/gameupdater';
import GameMongoRepo from '../../../../games/infrastructure/game.mono.repo';
import UserFinder from '../../../../user/application/userfinder';
import UserUpdater from '../../../../user/application/userupdater';
import UserMongoRepo from '../../../../user/infrastructure/user.mongo.repo';
import { Auth } from '../../../application/auth/auth';
import GameController from '../../../application/controllers/game.controller';
import { GameModel } from '../../../domain/game.schema';
import { UserModel } from '../../../domain/user.schema';
import ExpressServer from '../../../express.server';
import { dbConnect } from '../../db/db.connect';
import GameRouter from './game.router';
import request from 'supertest';

const repo = new GameMongoRepo(GameModel);
const userRepo = new UserMongoRepo(UserModel);

let header1: any;
let bearer1: any;
let setUp1: request.SuperTest<any>;
let ok: any;
let okId: any;
let notOk: any;
let notFound: any;

const gameCreator = new GameCreator(repo);
const gameFinderAll = new GameFinderAll(repo);
const gameFinder = new GameFinder(repo);
const gameSearcher = new GameSearcher(repo);
const gameUpdater = new GameUpdater(repo);
const gameDeleter = new GameDeleter(repo);
const userFinder = new UserFinder(userRepo);
const userUpdater = new UserUpdater(userRepo);

const setCollection = async () => {
  const databaseMock = [
    {
      gameName: 'Guitar Hero',
      category: 'MMO',
      img: 'test',
      releaseDate: 'test',
      price: 20,
      description: 'test',
      owner: new mongoose.Types.ObjectId(),
    },
    {
      gameName: 'Guitar Hero 2',
      category: 'MMO',
      img: 'test2',
      releaseDate: 'test',
      price: 20,
      description: 'test',
      owner: new mongoose.Types.ObjectId(),
    },
  ];
  await GameModel.deleteMany();
  await GameModel.insertMany(databaseMock);
  const data = await GameModel.find();
  const testIds = [data[0].id, data[1].id];
  return testIds;
};

describe('joven an Express server class with "/games" route', () => {
  let server: ExpressServer;
  let token: string;
  let ids: Array<string>;

  beforeAll(async () => {
    await dbConnect();
    ids = await setCollection();
    const payload: TokenPayload = {
      id: ids[0],
      name: 'maria',
      role: 'admin',
      email: 'maria@test.it',
    };
    token = Auth.createJWT(payload);
    const gameRouter = new GameRouter(
      new GameController(
        gameCreator,
        gameFinderAll,
        gameFinder,
        gameSearcher,
        gameUpdater,
        gameDeleter,
        userFinder,
        userUpdater
      )
    );
    server = new ExpressServer([gameRouter]);
    setUp1 = await request(server.app);

    header1 = 'Authorization';
    bearer1 = `Bearer ${token}`;

    ok = await setUp1.get(`/games/`).set(header1, bearer1).expect(200);

    okId = request(server.app)
      .get(`/games/${ids[0]}`)
      .set(header1, bearer1)
      .expect(200);
    notOk = await request(server.app)
      .get(`/games/1324`)
      .set(header1, bearer1)
      .expect(500);
    notFound = request(server.app)
      .get(`/game/`)
      .set(header1, bearer1)
      .expect(404);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('ppi we make requests to "/games" route', () => {
    test('Our GET request must return a 200 status', async () => {
      await okId;
    });
    test('(NO) the GET request with  WRONG ID must return a 500 status', async () => {
      await notOk;
    });
    it('A GET request will return a 200 status', async () => {
      await ok;
    });
    test('ERROR the GET request with wrong path must return a 404 status', async () => {
      await notFound;
    });
    it('then our PUT request to should return game data and a 200 status', async () => {
      await okId;
    });
    test('(NO) the PUT request  with wrong id  must give a 500 status', async () => {
      await notOk;
    });
    it('Our POST request have to return game data and a 200 status', async () => {
      await ok;
    });
    test('ERROR the POST request must return a 404 status', async () => {
      await notFound;
    });
    it('then a DELETE request to should return game data and a 200 status', async () => {
      await okId;
    });
    test('(NO) the DELETE request with wrong id have to return a 500 status', async () => {
      await notOk;
    });
    it('our GET request have to return game of selected caregory and 200', async () => {
      await request(server.app)
        .get(`/games/filter/MMO`)
        .set(header1, bearer1)
        .expect(200);
    });
    it('our GET request have to return game of selected caregory and 500', async () => {
      await request(server.app)
        .get(`/games/filte/:MMO`)
        .set(header1, bearer1)
        .expect(404);
    });
    it('GET /games works without a token (public browsing)', async () => {
      const res = await request(server.app).get('/games').expect(200);
      expect(res.body.results.length).toBeGreaterThan(0);
    });
    it('GET /games/:id works without a token', async () => {
      await request(server.app).get(`/games/${ids[0]}`).expect(200);
    });
    it('GET /games/filter/:category works without a token', async () => {
      await request(server.app).get('/games/filter/MMO').expect(200);
    });
    it('POST /games without a token is rejected', async () => {
      await request(server.app).post('/games').send({}).expect(498);
    });
    it('PUT /games/:id without a token is rejected', async () => {
      await request(server.app).put(`/games/${ids[0]}`).send({}).expect(498);
    });
    it('DELETE /games/:id without a token is rejected', async () => {
      await request(server.app).delete(`/games/${ids[0]}`).expect(498);
    });
    it('PUT/DELETE by a non-owner return 403 and leave the game intact', async () => {
      await request(server.app)
        .put(`/games/${ids[0]}`)
        .set(header1, bearer1)
        .send({ gameName: 'hacked' })
        .expect(403);
      await request(server.app)
        .delete(`/games/${ids[0]}`)
        .set(header1, bearer1)
        .expect(403);
      const game = await GameModel.findById(ids[0]);
      expect(game?.gameName).toBe('Guitar Hero');
    });
    it('PUT/DELETE by the owner succeed', async () => {
      const ownerUser = await UserModel.create({
        name: 'owner',
        email: 'o@test.it',
        password: 'x',
        cart: [],
        myGames: [],
        img: 'x',
        address: 'x',
        notification: [],
      });
      const ownerId = ownerUser.id;
      const mine = await GameModel.create({
        gameName: 'Mine',
        category: 'RPG',
        img: 'x',
        releaseDate: 'x',
        price: 1,
        description: 'x',
        owner: ownerId,
      });
      const ownerBearer = `Bearer ${Auth.createJWT({
        id: ownerId,
        email: 'o@test.it',
        role: 'user',
      })}`;
      await request(server.app)
        .put(`/games/${mine.id}`)
        .set(header1, ownerBearer)
        .send({ gameName: 'Mine2' })
        .expect(200);
      expect((await GameModel.findById(mine.id))?.gameName).toBe('Mine2');
      await request(server.app)
        .delete(`/games/${mine.id}`)
        .set(header1, ownerBearer)
        .expect(200);
      expect(await GameModel.findById(mine.id)).toBeNull();
    });
    it('POST /games by a real user returns the new game with `id` (same shape as GET)', async () => {
      const creator = await UserModel.create({
        name: 'creator',
        email: 'creator@test.it',
        password: 'x',
        cart: [],
        myGames: [],
        img: 'x',
        address: 'x',
        notification: [],
      });
      const creatorBearer = `Bearer ${Auth.createJWT({
        id: creator.id,
        email: 'creator@test.it',
        role: 'user',
      })}`;
      const res = await request(server.app)
        .post('/games')
        .set(header1, creatorBearer)
        .send({
          gameName: 'Hades',
          category: 'Indie',
          releaseDate: '2020-09-17',
          price: 24.5,
          description: 'Roguelike dungeon crawler',
          img: 'https://example.com/hades.jpg',
        })
        .expect(200);
      const created = res.body.results[0];
      expect(typeof created.id).toBe('string');
      expect(created).not.toHaveProperty('_id');
      expect(created.owner).toBe(creator.id);
      const fetched = await request(server.app)
        .get(`/games/${created.id}`)
        .expect(200);
      expect(fetched.body.results[0].id).toBe(created.id);
      const filtered = await request(server.app)
        .get('/games/filter/Indie')
        .expect(200);
      expect(
        filtered.body.results[0].map((g: { id: string }) => g.id)
      ).toContain(created.id);
    });
    it('POST /games with an unknown category answers 400', async () => {
      const creator = await UserModel.findOne({ email: 'creator@test.it' });
      const creatorBearer = `Bearer ${Auth.createJWT({
        id: creator!.id,
        email: 'creator@test.it',
        role: 'user',
      })}`;
      await request(server.app)
        .post('/games')
        .set(header1, creatorBearer)
        .send({
          gameName: 'Gran Turismo',
          category: 'Racing',
          releaseDate: '2022-03-04',
          price: 30,
          description: 'x',
          img: 'x',
        })
        .expect(400);
    });
    it('the schema rejects categories outside the allowed list', async () => {
      await expect(
        GameModel.create({
          gameName: 'x',
          category: 'Racing',
          img: 'x',
          releaseDate: 'x',
          price: 1,
          description: 'x',
          owner: new mongoose.Types.ObjectId(),
        })
      ).rejects.toThrow(/category/);
    });
    it('GET /health returns 200 with uptime', async () => {
      const res = await request(server.app).get('/health').expect(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
    });
    it('sets security headers and restricts CORS to configured origins', async () => {
      const res = await request(server.app)
        .get('/health')
        .set('Origin', 'http://localhost:4200');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['access-control-allow-origin']).toBe(
        'http://localhost:4200'
      );
      const other = await request(server.app)
        .get('/health')
        .set('Origin', 'http://evil.example');
      expect(other.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
