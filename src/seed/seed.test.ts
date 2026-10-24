import mongoose from 'mongoose';
import { Auth } from '../server/application/auth/auth';
import { GameModel } from '../server/domain/game.schema';
import { UserModel } from '../server/domain/user.schema';
import { dbConnect } from '../server/infrastructures/db/db.connect';
import { seed } from './seed';
import { DEMO_USER, SELLERS } from './demo-data';

jest.spyOn(console, 'log').mockImplementation(() => undefined);

describe('Given the demo seed', () => {
  beforeAll(async () => {
    await dbConnect('test');
    await GameModel.deleteMany();
    await UserModel.deleteMany();
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('Then running it twice creates one hashed user and 10 games', async () => {
    await seed();
    await seed();
    const users = await UserModel.find({ email: DEMO_USER.email });
    expect(users).toHaveLength(1);
    expect(users[0].password).not.toBe(DEMO_USER.password);
    expect(await Auth.compare(DEMO_USER.password, users[0].password)).toBe(
      true
    );
    expect(users[0].myGames).toHaveLength(3);
    expect(await GameModel.countDocuments()).toBe(10);
  });

  test('Then the catalog is spread across sellers, demo owns only 3', async () => {
    const demo = await UserModel.findOne({ email: DEMO_USER.email });
    expect(await GameModel.countDocuments({ owner: demo!._id })).toBe(3);
    const sellers = await UserModel.find({
      email: { $in: SELLERS.map((s) => s.email) },
    });
    expect(sellers).toHaveLength(4);
    const sellerGames = await Promise.all(
      sellers.map((s) => GameModel.countDocuments({ owner: s._id }))
    );
    expect(sellerGames.reduce((a, b) => a + b, 0)).toBe(7);
    sellers.forEach((s, i) => expect(s.myGames).toHaveLength(sellerGames[i]));
  });

  test('Then re-seeding moves games off a demo user that owned all of them', async () => {
    const demo = await UserModel.findOne({ email: DEMO_USER.email });
    const all = await GameModel.find();
    await UserModel.updateOne(
      { _id: demo!._id },
      { $set: { myGames: all.map((g) => g._id) } }
    );
    await seed();
    const after = await UserModel.findOne({ email: DEMO_USER.email });
    expect(after!.myGames).toHaveLength(3);
  });

  test('Then games carry real genres (GTA is Action, FIFA is Sports)', async () => {
    const gta = await GameModel.findOne({ gameName: 'Grand Theft Auto V' });
    const fifa = await GameModel.findOne({ gameName: 'FIFA 23' });
    expect(gta?.category).toBe('Action');
    expect(fifa?.category).toBe('Sports');
    expect(await GameModel.countDocuments({ category: 'MMO' })).toBe(1);
  });
});
