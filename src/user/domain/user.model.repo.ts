import User from "./user.model.js";


export default interface UserRepository {
  create: (user: User) => Promise<void>;
  update: (user: Partial<User>) => Promise<void>;
  find: (id: string) => Promise<User | null>;
  delete: (id: string) => Promise<void>;
  search: (query: { key: string; value: unknown }) => Promise<User[]>;
}
