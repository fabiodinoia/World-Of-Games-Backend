import { model, Schema, SchemaTypes } from 'mongoose';
import Game, { GAME_CATEGORIES } from '../../games/domain/game.model.js';

const gameSchema = new Schema<Game>({
  gameName: {
    type: String,
    required: true,
    unique: false,
  },
  releaseDate: {
    type: String,
    required: true,
    unique: false,
  },
  category: {
    type: String,
    required: true,
    enum: GAME_CATEGORIES,
    unique: false,
  },
  price: {
    type: Number,
    required: true,
    unique: false,
  },
  description: {
    type: String,
    required: true,
    unique: false,
  },
  img: {
    type: String,
    required: true,
    unique: false,
  },
  owner: {
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
  },
});

gameSchema.set('toJSON', {
  transform(document, returnedObject) {
    // Read the id from the source document: when one game is populated more
    // than once (e.g. twice in a cart) the plain objects can share state, and
    // `returnedObject._id` is already gone for the repeats.
    returnedObject.id = String(document._id ?? returnedObject._id);
    delete returnedObject.__v;
    delete returnedObject._id;
  },
});

export const GameModel = model('Games', gameSchema, 'games');
