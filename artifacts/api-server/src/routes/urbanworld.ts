import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { urbanworldSessions } from "@workspace/db";
export default makeForgeRouter(urbanworldSessions as unknown as ForgeTable, "urbanworld");
