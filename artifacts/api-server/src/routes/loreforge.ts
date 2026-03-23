import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { loreforgeSessions } from "@workspace/db";
export default makeForgeRouter(loreforgeSessions as unknown as ForgeTable, "loreforge");
