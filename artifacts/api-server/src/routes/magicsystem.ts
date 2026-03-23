import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { magicsystemSessions } from "@workspace/db";
export default makeForgeRouter(magicsystemSessions as unknown as ForgeTable, "magicsystem");
