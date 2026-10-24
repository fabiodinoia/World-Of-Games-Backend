// Runs in every test worker before modules load: no .env required.
process.env.NODE_ENV = 'test';
process.env.SECRET = process.env.SECRET || 'test-secret';
