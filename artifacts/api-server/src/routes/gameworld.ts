import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { gameworldSessions } from "@workspace/db";
export default makeForgeRouter(gameworldSessions as unknown as ForgeTable, "gameworld");
