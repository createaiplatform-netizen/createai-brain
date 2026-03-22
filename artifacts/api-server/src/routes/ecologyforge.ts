import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { ecologyforgeSessions } from "@workspace/db";
export default makeForgeRouter(ecologyforgeSessions as ForgeTable, "ecologyforge");
