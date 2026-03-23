import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { mythweaveSessions } from "@workspace/db";
export default makeForgeRouter(mythweaveSessions as unknown as ForgeTable, "mythweave");
