import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import openaiRouter from "./openai";
import projectsRouter from "./projects";
import brainstormRouter from "./brainstorm";
import projectChatRouter from "./projectChat";
import userRouter from "./user";
import activityRouter from "./activity";
import conversationsRouter from "./conversations";
import integrationsRouter from "./integrations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/openai", openaiRouter);
router.use("/projects", projectsRouter);
router.use("/brainstorm", brainstormRouter);
router.use("/project-chat", projectChatRouter);
router.use("/user", userRouter);
router.use("/activity", activityRouter);
router.use("/conversations", conversationsRouter);
router.use("/integrations", integrationsRouter);

export default router;
