import Game from '../../games/domain/game.model.js';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export default class User {
  // eslint-disable-next-line no-useless-constructor, max-params
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public password: string,
    public cart: Game[],
    public myGames: Game[],
    public img: string,
    public address: string,
    public notification: string[],
    public role: UserRole = UserRole.USER
  ) {}
}
