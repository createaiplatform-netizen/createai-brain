import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { magicsystemSessions } from "@workspace/db";
export default makeForgeRouter(magicsystemSessions as ForgeTable, "magicsystem");
