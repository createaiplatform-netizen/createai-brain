import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { visualworldSessions } from "@workspace/db";
export default makeForgeRouter(visualworldSessions as ForgeTable, "visualworld");
