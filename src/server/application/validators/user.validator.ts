import z from "zod";
import { HTTPError } from "../../../commons/error.js";
import { NextFunction, Request, Response } from "express";

export const registerUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    img: z.string().min(1).optional().or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value)),
    address: z.string().min(1).optional(),
});

export const validateRegisterUser = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        req.body = registerUserSchema.parse(req.body);
        next();
    } catch(error) {
        if( error instanceof z.ZodError) {
            next(new HTTPError(400, 'Invalid request body', error.message));
        } else {
            next(error);
        }
    }
}
