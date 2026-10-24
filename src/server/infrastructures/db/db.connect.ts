import mongoose from 'mongoose';
import { config } from '../../../config.js';
import createDebug from 'debug';
const debug = createDebug('dbConnect');

export const dbConnect = (env?: string) => {
  const finalEnv = env || process.env.NODE_ENV;
  const finalDBname =
    finalEnv === 'test' ? config.dbname + '_Testing' : config.dbname;

  // Read env at call time so tests can inject an in-memory server URI.
  const baseUri =
    process.env.MONGODB_URI ||
    `mongodb+srv://${encodeURIComponent(config.user ?? '')}:${encodeURIComponent(
      config.pass ?? ''
    )}@${config.cluster}/?retryWrites=true&w=majority`;

  debug('Connecting to database', finalDBname);
  return mongoose.connect(baseUri, { dbName: finalDBname });
};
