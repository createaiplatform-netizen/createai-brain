import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { imaginationSessions } from "@workspace/db";
export default makeForgeRouter(imaginationSessions as ForgeTable, "imagination");
