import { type Express, Router } from "express";
import { validateAuthenticate, validateJWT, validateRegister } from "@/middlewares";
import { authenticateController } from "./authenticateController";
import { registerController } from "./registerController";

const userRouter = Router();

userRouter.post("/users", validateRegister, registerController);
userRouter.post(
	"/users/authenticate",
	validateAuthenticate,
	authenticateController,
);

export default userRouter;
