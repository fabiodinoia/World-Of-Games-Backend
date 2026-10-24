import { randomBytes } from 'node:crypto';
import { Auth } from '../server/application/auth/auth.js';
import { GameModel } from '../server/domain/game.schema.js';
import { UserModel } from '../server/domain/user.schema.js';
import { DEMO_USER, SELLERS, demoGames } from './demo-data.js';

const upsertUser = async (profile: object & { email: string }, plain: string) =>
  UserModel.findOneAndUpdate(
    { email: profile.email },
    { $set: { ...profile, password: await Auth.hash(plain) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

// Idempotent: upserts the demo user and sellers by email and each game by name.
export const seed = async (imgBase = 'assets/covers') => {
  const { password, ...profile } = DEMO_USER;
  const user = await upsertUser(profile, password);
  const users = [user];
  for (const seller of SELLERS) {
    // eslint-disable-next-line no-await-in-loop
    users.push(await upsertUser(seller, randomBytes(24).toString('base64url')));
  }

  const byEmail = new Map(users.map((u) => [u.email, u]));
  const games = [];
  for (const { seller, ...game } of demoGames(imgBase)) {
    // eslint-disable-next-line no-await-in-loop
    const saved = await GameModel.findOneAndUpdate(
      { gameName: game.gameName },
      { $set: { ...game, owner: byEmail.get(seller as string)!._id } },
      { upsert: true, new: true }
    );
    games.push(saved);
  }

  // Each seed game sits in exactly its owner's myGames (fixes older seeds
  // where the demo user owned all of them).
  const seedIds = games.map((g) => g._id);
  for (const u of users) {
    const owned = games.filter((g) => String(g.owner) === String(u._id)).map((g) => g._id);
    const notOwned = seedIds.filter((id) => !owned.some((o) => o.equals(id)));
    // eslint-disable-next-line no-await-in-loop
    await UserModel.updateOne({ _id: u._id }, { $pull: { myGames: { $in: notOwned } } });
    // eslint-disable-next-line no-await-in-loop
    await UserModel.updateOne({ _id: u._id }, { $addToSet: { myGames: { $each: owned } } });
  }

  return { user, sellers: users.slice(1), games };
};
