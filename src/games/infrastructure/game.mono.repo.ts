import { GameModel } from '../../server/domain/game.schema.js';
import Game from '../domain/game.model.js';
import GameRepository from '../domain/game.repo.model.js';

export default class GameMongoRepo implements GameRepository {
  private gameModel: typeof GameModel;

  constructor(gameModel: typeof GameModel) {
    this.gameModel = gameModel;
  }

  async create(game: Game): Promise<Game> {
    const data = await this.gameModel.create(game);
    return data;
  }

  async update(game: Partial<Game>): Promise<void> {
    await this.gameModel.findByIdAndUpdate(game.id, game);
  }

  async findAll(): Promise<Game[]> {
    const response = await this.gameModel.find().populate('owner', '-cart');
    return response;
  }

  async findOne(id: string): Promise<Game | null> {
    const response = await this.gameModel
      .findById(id)
      .populate('owner', '-cart');
    return response;
  }

  async delete(id: string): Promise<void> {
    await this.gameModel.findByIdAndDelete(id);
  }

  async search(query: { key: string; value: unknown }): Promise<Game[]> {
    const response = await this.gameModel.find({ [query.key]: query.value });

    return response;
  }
}
