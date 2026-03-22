import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { techforgeSessions } from "@workspace/db";
export default makeForgeRouter(techforgeSessions as ForgeTable, "techforge");
