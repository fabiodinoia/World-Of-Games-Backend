// Run the World of Games API locally with an in-memory MongoDB + demo seed.
// No Atlas, no .env needed:  node local-demo.mjs   (API on :4800)
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";

const mongod = await MongoMemoryServer.create();
const env = {
  ...process.env,
  MONGODB_URI: mongod.getUri(),
  NAME: "worldofgames",
  SECRET: "local-demo-secret",
  PORT: "4800",
  CORS_ORIGINS: "http://localhost:4200",
  NODE_ENV: "production",
};

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env, stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} -> ${code}`))));
  });

await run("npm", ["run", "seed"]);
console.log("[local-demo] seeded; starting API on :4800");
const api = spawn("node", ["./dist/index.js"], { env, stdio: "inherit" });

const stop = async () => {
  api.kill();
  await mongod.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
