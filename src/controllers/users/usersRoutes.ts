import { type Express, Router } from "express";
import { validateAuthenticate, validateJWT, validateRegister } from "@/middlewares";
import { authenticateController } from "./authenticateController";
import { registerController } from "./registerController";
import { usersController } from "./usersController";

const userRouter = Router();

userRouter.post("/users", validateRegister, registerController);
userRouter.post(
	"/users/authenticate",
	validateAuthenticate,
	authenticateController,
);

userRouter.get("/users", validateJWT("admin"), usersController);

export default userRouter;
