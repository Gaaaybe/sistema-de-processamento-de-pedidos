import type { Express, Request, Response } from "express";
import express from "express";
import userRouter from "./users/usersRoutes";

const routes = (app: Express) => {
	app
		.route("/")
		.get((req: Request, res: Response) => res.status(200).send("API Node.js"));
	app.use(userRouter);
};

export default routes;
