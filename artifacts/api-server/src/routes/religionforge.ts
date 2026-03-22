import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { religionforgeSessions } from "@workspace/db";
export default makeForgeRouter(religionforgeSessions as ForgeTable, "religionforge");
