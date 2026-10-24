import { z } from "zod";
import Game from "../../../games/domain/game.model";
import { UserRole } from "../../../user/domain/user.model";
import { registerUserSchema } from "../validators/user.validator";


export type CreateUserDto = {
  name: string;
  email: string;
  password: string;
  img: string;
  cart: Game[];
  myGames: Game[];
  address: string;
  notification: string[];
  role: UserRole;
};

export const buildCreateUserDto = ( body: z.infer<typeof registerUserSchema>): CreateUserDto => ({
    ...body,
    role: UserRole.USER as UserRole,
    cart: [],
    myGames: [],
    notification: [],
    img: body.img || '',
    address: body.address || '',
});