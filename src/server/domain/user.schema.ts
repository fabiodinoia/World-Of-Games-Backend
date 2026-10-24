import { model, Schema, SchemaTypeOptions, SchemaTypes } from 'mongoose';
import User, { UserRole } from '../../user/domain/user.model.js';

const userSchema = new Schema<User>({
  name: {
    type: String,
    required: true,
    unique: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: false,
  },
  cart: [
    {
      type: SchemaTypes.ObjectId,
      ref: 'Games',
    },
  ],
  myGames: [
    {
      type: SchemaTypes.ObjectId,
      ref: 'Games',
    },
  ],
  address: {
    type: String,
    required: false,
    unique: false,
  },
  role: {
    type: String as SchemaTypeOptions<UserRole>['type'],
    enum: UserRole,
    default: UserRole.USER,
    required: true,
  },
});

userSchema.set('toJSON', {
  transform(_document, returnedObject) {
    returnedObject.id = returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject._id;
    delete returnedObject.password;
  },
});

export const UserModel = model('User', userSchema, 'users');
