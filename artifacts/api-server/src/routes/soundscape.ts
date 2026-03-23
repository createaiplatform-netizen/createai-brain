import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { soundscapeSessions } from "@workspace/db";
export default makeForgeRouter(soundscapeSessions as unknown as ForgeTable, "soundscape");
