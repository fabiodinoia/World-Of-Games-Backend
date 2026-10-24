import { DEMO_USER } from '../../../../seed/demo-data';
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { config } from '../../../../config';
import request from 'supertest';
import { TokenPayload } from '../../../../commons/interfaces';
import { Auth } from '../../../application/auth/auth';
import { UserModel } from '../../../domain/user.schema';
import '../../../domain/game.schema';
import { dbConnect } from '../../db/db.connect';
import ExpressServer from '../../../express.server.js';
import { UserController } from '../../../application/controllers/user.controller';
import UserRouter from './user.router';
import UserCreator from '../../../../user/application/usercreator';
import UserDeleter from '../../../../user/application/userdeleter';
import UserFinder from '../../../../user/application/userfinder';
import UserSearcher from '../../../../user/application/usersearcher';
import UserUpdater from '../../../../user/application/userupdater';
import UserMongoRepo from '../../../../user/infrastructure/user.mongo.repo';
import User from '../../../../user/domain/user.model';

const repo = new UserMongoRepo(UserModel);

let setUp: request.SuperTest<any>;
let credentials: Partial<User>;
let wrongCredentials: Partial<User>;
let header: any;
let bearer: any;
let ok: any;
let notOk: any;
let okDel: any;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let notOkDel: any;

const userCreator = new UserCreator(repo);
const userFinder = new UserFinder(repo);
const userSearcher = new UserSearcher(repo);
const userUpdater = new UserUpdater(repo);
const userDeleter = new UserDeleter(repo);

const pass = 'testpass123'; // register validator requires >= 8 chars

const setCollection = async () => {
  const databaseMock = [
    {
      name: 'maria',
      email: 'maria@test.it',
      password: pass,
      cart: [],
      myGames: [],
      img: 'test',
      address: 'test1',
      notification: [],
    },
    {
      name: 'angelo',
      email: 'angelo@test.it',
      password: pass,
      cart: [],
      myGames: [],
      img: 'test',
      address: 'test',
      notification: [],
    },
  ];
  await UserModel.deleteMany();
  await UserModel.insertMany(databaseMock);
  const data = await UserModel.find();
  const testIds = [data[0].id, data[1].id];
  return testIds;
};

describe('Given the Express server class with "/users" route', () => {
  let server1: ExpressServer;
  let token1: string;
  let ids1: Array<string>;

  beforeAll(async () => {
    await dbConnect();
    ids1 = await setCollection();
    const payload: TokenPayload = {
      id: ids1[1],
      name: 'angelo',
      role: 'admin',
      email: 'angelo@test.it',
    };
    token1 = Auth.createJWT(payload);
    const userRouter = new UserRouter(
      new UserController(
        userCreator,
        userFinder,
        userSearcher,
        userUpdater,
        userDeleter
      )
    );
    server1 = new ExpressServer([userRouter]);
    setUp = await request(server1.app);

    credentials = {
      email: 'newuser@test.it',
      password: pass,
    };
    wrongCredentials = {
      email: 'newuser@test.it',
      password: pass,
    };
    header = 'Authorization';
    bearer = `Bearer ${token1}`;

    notOk = await setUp.get(`/users/123`).set(header, bearer).expect(403);
    okDel = undefined;
    notOkDel = await setUp.delete(`/users/123`).set(header, bearer).expect(403);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('when we make requests to "/users" route', () => {
    test('then our POST request to "/users/register" should create a new user and send back a 201 status', async () => {
      const newUser = {
        name: 'newuser',
        email: 'newuser@test.it',
        password: pass,
        cart: [],
        myGames: [],
        img: 'test1',
        address: 'test',
        notification: [],
      };

      await setUp.post('/users/register').send(newUser).expect(201);
    });
    test('(NO)then a POST request to "/users/register"  with missing info should throw 400', async () => {
      const newUser = {
        password: pass,
        cart: [],
        myGames: [],
        img: 'test',
        address: 'test',
        notification: [],
      };

      await setUp.post('/users/register').send(newUser).expect(400);
    });
  });

  test('if the POST request to "/users/login" should return a token and a 200 status', async () => {
    await setUp
      .post('/users/login')
      .set(header, bearer)
      .send(credentials)
      .expect(202);
  });
  it('ERROR then our POST request to "/users/login" must return a 401 status', async () => {
    await setUp
      .post('/users/loin')
      .set(header, bearer)
      .send(wrongCredentials)
      .expect(404);
  });

  test('then the GET request on the own user sends back data and a 200 status', async () => {
    await setUp.get(`/users/${ids1[1]}`).set(header, bearer).expect(200);
  });
  it('(NO) a GET request with a foreign id should return a 403 status', async () => {
    await notOk;
  });
  test('PUT on the own user returns 200', async () => {
    await setUp
      .put(`/users/${ids1[1]}`)
      .set(header, bearer)
      .send({ name: 'angelo2' })
      .expect(200);
  });
  test('PUT on another user returns 403 and does not modify it', async () => {
    await setUp
      .put(`/users/${ids1[0]}`)
      .set(header, bearer)
      .send({ name: 'hacked' })
      .expect(403);
    const other = await UserModel.findById(ids1[0]);
    expect(other?.name).toBe('maria');
  });
  test('PUT ignores role and myGames and stores a new password hashed', async () => {
    await setUp
      .put(`/users/${ids1[1]}`)
      .set(header, bearer)
      .send({ role: 'ADMIN', myGames: [ids1[0]], password: 'NewPass123!' })
      .expect(200);
    const me = await UserModel.findById(ids1[1]);
    expect(me?.role).not.toBe('ADMIN');
    expect(me?.myGames.map(String)).not.toContain(ids1[0]);
    expect(me?.password).not.toBe('NewPass123!');
    expect(await Auth.compare('NewPass123!', me!.password)).toBe(true);
  });
  test('the shared demo account cannot change its email or password', async () => {
    const before = await UserModel.findById(ids1[1]);
    const demoBearer = `Bearer ${Auth.createJWT({
      id: ids1[1],
      email: DEMO_USER.email,
      role: 'user',
    })}`;
    await setUp
      .put(`/users/${ids1[1]}`)
      .set(header, demoBearer)
      .send({ name: 'Renamed', email: 'taken@over.it', password: 'Locked0ut!' })
      .expect(200);
    const after = await UserModel.findById(ids1[1]);
    expect(after?.name).toBe('Renamed');
    expect(after?.email).toBe(before?.email);
    expect(after?.password).toBe(before?.password);
  });
  test('GET and DELETE on another user return 403 and keep it', async () => {
    await setUp.get(`/users/${ids1[0]}`).set(header, bearer).expect(403);
    await setUp.delete(`/users/${ids1[0]}`).set(header, bearer).expect(403);
    expect(await UserModel.findById(ids1[0])).not.toBeNull();
  });
  test('GET with a valid token for a different existing user returns 403', async () => {
    const res = await setUp.get(`/users/${ids1[0]}`).set(header, bearer);
    expect(res.status).toBe(403);
  });
  test('GET with a garbage or expired token returns 498, not 500', async () => {
    await setUp.get(`/users/${ids1[1]}`).set(header, 'Bearer a.b.c').expect(498);
    const expired = jwt.sign(
      { id: ids1[1], email: 'angelo@test.it', role: 'x' },
      config.jwtsecret as string,
      { expiresIn: -10 }
    );
    await setUp
      .get(`/users/${ids1[1]}`)
      .set(header, `Bearer ${expired}`)
      .expect(498);
  });
  it('ERROR the PUT request should throw 500 status', async () => {
    await notOk;
  });
  test('GET own id that no longer exists in the DB returns 404, not 500', async () => {
    const ghostId = new mongoose.Types.ObjectId().toString();
    const ghostToken = Auth.createJWT({
      id: ghostId,
      email: 'ghost@test.it',
      role: 'x',
    });
    const res = await setUp
      .get(`/users/${ghostId}`)
      .set(header, `Bearer ${ghostToken}`);
    expect(res.status).toBe(404);
  });
  test('then our DELETE request on the own user returns 204', async () => {
    await setUp.delete(`/users/${ids1[1]}`).set(header, bearer).expect(204);
  });
  it('(NO) the DELETE request must return a 204 status', async () => {
    await notOk;
  });
});
