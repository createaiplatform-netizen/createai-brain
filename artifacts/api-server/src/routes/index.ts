import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import projectsRouter from "./projects";
import brainstormRouter from "./brainstorm";
import projectChatRouter from "./projectChat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", openaiRouter);
router.use("/projects", projectsRouter);
router.use("/brainstorm", brainstormRouter);
router.use("/project-chat", projectChatRouter);

export default router;
