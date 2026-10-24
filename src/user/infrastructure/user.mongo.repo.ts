import { UserModel } from '../../server/domain/user.schema.js';
import User from '../domain/user.model.js';
import UserRepository from '../domain/user.model.repo.js';

export default class UserMongoRepo implements UserRepository {
  private userModel: typeof UserModel;

  constructor(userModel: typeof UserModel) {
    this.userModel = userModel;
  }

  async create(user: User): Promise<void> {
    await this.userModel.create(user);
  }

  async update(user: Partial<User>): Promise<void> {
    await this.userModel.findByIdAndUpdate(user.id, user);
  }

  async find(id: string): Promise<User | null> {
    const response = await this.userModel
      .findById(id)
      .populate('myGames', '-owner').populate('cart', '-owner');
    return response as User;
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id);
  }

  async search(query: { key: string; value: unknown }): Promise<User[]> {
    const response = await this.userModel.find({ [query.key]: query.value });

    return response;
  }
}
