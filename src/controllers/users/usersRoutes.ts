import { type Express, Router } from "express";
import { validateAuthenticate } from "../middlewares/validateAuthenticate";
import { validateJWT } from "../middlewares/validateJWT";
import { validateRegister } from "../middlewares/validateRegister";
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
