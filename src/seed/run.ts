import mongoose from 'mongoose';
import { dbConnect } from '../server/infrastructures/db/db.connect.js';
import { DEMO_USER } from './demo-data.js';
import { seed } from './seed.js';

const run = async () => {
  await dbConnect();
  const { games } = await seed(process.env.SEED_IMG_BASE);
  console.log(
    `Seeded ${DEMO_USER.email} and ${games.length} games into "${mongoose.connection.db.databaseName}"`
  );
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
