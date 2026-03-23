import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { cosmologyforgeSessions } from "@workspace/db";
export default makeForgeRouter(cosmologyforgeSessions as unknown as ForgeTable, "cosmologyforge");
