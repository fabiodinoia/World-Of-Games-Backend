import mongoose from 'mongoose';
import UserMongoRepo from '../../user/infrastructure/user.mongo.repo';
import { dbConnect } from '../infrastructures/db/db.connect';
import { GameModel } from './game.schema';
import { UserModel } from './user.schema';

describe('Given the Game schema JSON shape', () => {
  beforeAll(async () => {
    await dbConnect('test');
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('Then every populated cart entry keeps its id, even repeated ones', async () => {
    const owner = new mongoose.Types.ObjectId();
    const base = {
      releaseDate: '2020-01-01',
      price: 10,
      description: 'x',
      img: 'x',
      owner,
    };
    const [a, b] = await GameModel.insertMany([
      { ...base, gameName: 'A', category: 'Indie' },
      { ...base, gameName: 'B', category: 'Sports' },
    ]);
    const user = await UserModel.create({
      name: 'cart',
      email: `cart-${Date.now()}@test.it`,
      password: 'x',
      cart: [a._id, a._id, b._id],
      myGames: [],
      img: 'x',
      address: 'x',
    });

    const found = await new UserMongoRepo(UserModel).find(user.id);
    const json = JSON.parse(JSON.stringify(found));

    expect(json.cart.map((g: { id: string }) => g.id)).toEqual([
      a.id,
      a.id,
      b.id,
    ]);
    expect(json.cart[1]).not.toHaveProperty('_id');
  });

  test('Then the id falls back to the plain object when the source has none', () => {
    const transform = (GameModel.schema.get('toJSON') as { transform: Function }).transform;
    const ret: Record<string, unknown> = { _id: 'abc', __v: 0, gameName: 'x' };
    transform({}, ret);
    expect(ret).toEqual({ id: 'abc', gameName: 'x' });
  });
});
