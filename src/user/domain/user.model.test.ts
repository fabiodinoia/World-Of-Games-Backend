import User, { UserRole } from './user.model';

describe('Given the User model', () => {
  test('When constructed without a role, then it defaults to USER', () => {
    const user = new User('u1', 'Ana', 'a@b.it', 'hash', [], [], 'a.png', 'Madrid', []);
    expect(user).toMatchObject({ id: 'u1', name: 'Ana', address: 'Madrid' });
    expect(user.role).toBe(UserRole.USER);
  });

  test('When constructed with a role, then it keeps it', () => {
    const admin = new User('u2', 'Bo', 'b@b.it', 'hash', [], [], '', '', [], UserRole.ADMIN);
    expect(admin.role).toBe(UserRole.ADMIN);
  });
});
