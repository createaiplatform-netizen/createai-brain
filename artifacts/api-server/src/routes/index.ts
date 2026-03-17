import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import openaiRouter from "./openai";
import projectsRouter from "./projects";
import brainstormRouter from "./brainstorm";
import projectChatRouter from "./projectChat";
import userRouter from "./user";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/openai", openaiRouter);
router.use("/projects", projectsRouter);
router.use("/brainstorm", brainstormRouter);
router.use("/project-chat", projectChatRouter);
router.use("/user", userRouter);

export default router;
