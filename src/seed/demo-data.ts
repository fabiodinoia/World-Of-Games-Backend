import { UserRole } from '../user/domain/user.model.js';

export const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@worldofgames.dev',
  password: 'DemoPass123!',
  address: '1 Demo Street, Madrid',
  role: UserRole.USER,
};

// Other sellers own most of the catalog, so the shared demo account can only
// delete its own few listings. They get a random password at seed time:
// nobody can sign in as them.
export const SELLERS = [
  { name: 'Lucía Martín', email: 'lucia@worldofgames.dev', address: 'Calle Mayor 12, Madrid' },
  { name: 'Kenji Sato', email: 'kenji@worldofgames.dev', address: '2-1 Shibuya, Tokyo' },
  { name: 'Marcus Reed', email: 'marcus@worldofgames.dev', address: '48 Sunset Blvd, Los Angeles' },
  { name: 'Ana Souza', email: 'ana@worldofgames.dev', address: 'Rua Augusta 300, São Paulo' },
].map((seller) => ({ ...seller, role: UserRole.USER }));

// Each game's `seller` is an email from DEMO_USER or SELLERS.
// Cover images live in the frontend (src/assets/covers). `img` is a path
// resolved by the frontend origin; override the base with SEED_IMG_BASE.
export const demoGames = (imgBase: string) =>
  [
    ['Grand Theft Auto V', 'Action', '2013-09-17', 29.99, 'gta', 'Open-world crime saga across Los Santos, with GTA Online.', 'marcus@worldofgames.dev'],
    ['FIFA 23', 'Sports', '2023-09-29', 59.99, 'fifa', 'The world\'s football simulation with online Ultimate Team.', 'lucia@worldofgames.dev'],
    ['Elden Ring', 'RPG', '2022-02-25', 49.99, 'er', 'Explore the Lands Between in FromSoftware\'s open-world action RPG.', 'demo@worldofgames.dev'],
    ['God of War', 'RPG', '2018-04-20', 39.99, 'gow', 'Kratos and Atreus journey through the Norse realms.', 'marcus@worldofgames.dev'],
    ['Final Fantasy XIV', 'MMO', '2013-08-27', 19.99, 'ff', 'Epic MMORPG set in the realm of Eorzea.', 'kenji@worldofgames.dev'],
    ['Kingdom Hearts III', 'RPG', '2019-01-29', 34.99, 'kh', 'Sora wields the Keyblade across Disney and Final Fantasy worlds.', 'kenji@worldofgames.dev'],
    ['League of Legends', 'MOBA', '2009-10-27', 0, 'lol', 'Fast-paced 5v5 strategy battles with over 160 champions.', 'ana@worldofgames.dev'],
    ['Valorant', 'FPS', '2020-06-02', 0, 'v', 'Tactical 5v5 character-based shooter.', 'ana@worldofgames.dev'],
    ['Clair Obscur: Expedition 33', 'RPG', '2025-04-24', 44.99, 'e33', 'Turn-based RPG with real-time defence in a painterly Belle Epoque world.', 'demo@worldofgames.dev'],
    ['Super Mario RPG', 'RPG', '2023-11-17', 49.99, 'sm', 'Mario and friends team up in this colourful turn-based adventure.', 'demo@worldofgames.dev'],
  ].map(([gameName, category, releaseDate, price, slug, description, seller]) => ({
    gameName,
    category,
    releaseDate,
    price,
    description,
    img: `${imgBase}/${slug}-cover.jpeg`,
    seller,
  }));
