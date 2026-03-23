import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { characterforgeSessions } from "@workspace/db";
export default makeForgeRouter(characterforgeSessions as unknown as ForgeTable, "characterforge");
