import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { warloreSessions } from "@workspace/db";
export default makeForgeRouter(warloreSessions as ForgeTable, "warlore");
