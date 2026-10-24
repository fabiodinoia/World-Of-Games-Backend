import User from '../../user/domain/user.model';
import Game, { isGameCategory } from './game.model';

describe('Given the Game model', () => {
  test('When constructed, then it keeps every field', () => {
    const owner = new User('u1', 'Ana', 'a@b.it', 'hash', [], [], '', '', []);
    const game = new Game('g1', 'Elden Ring', 'RPG', '2022-02-25', 'er.jpg', 49.99, 'Open world', owner);
    expect(game).toMatchObject({ id: 'g1', gameName: 'Elden Ring', category: 'RPG', price: 49.99, owner });
  });

  test('When checking categories, then only known ones pass', () => {
    expect(isGameCategory('RPG')).toBe(true);
    expect(isGameCategory('Racing')).toBe(false);
  });
});
