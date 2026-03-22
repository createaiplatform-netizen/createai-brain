import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { civilizationforgeSessions } from "@workspace/db";
export default makeForgeRouter(civilizationforgeSessions as ForgeTable, "civilizationforge");
