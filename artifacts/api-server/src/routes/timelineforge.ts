import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { timelineforgeSessions } from "@workspace/db";
export default makeForgeRouter(timelineforgeSessions as ForgeTable, "timelineforge");
