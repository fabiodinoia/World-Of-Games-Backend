import User from '../../user/domain/user.model.js';

/** Every category the API accepts (also enforced by the Mongoose schema). */
export const GAME_CATEGORIES = [
  'Action',
  'Adventure',
  'RPG',
  'FPS',
  'MOBA',
  'MMO',
  'Sports',
  'Strategy',
  'Indie',
] as const;

export type gameCategory = (typeof GAME_CATEGORIES)[number];

export const isGameCategory = (value: unknown): value is gameCategory =>
  typeof value === 'string' &&
  (GAME_CATEGORIES as readonly string[]).includes(value);

export default class Game {
  // eslint-disable-next-line no-useless-constructor, max-params
  constructor(
    public id: string,
    public gameName: string,
    public category: gameCategory,
    public releaseDate: string,
    public img: string,
    public price: number,
    public description: string,
    public owner: User
  ) {}
}
