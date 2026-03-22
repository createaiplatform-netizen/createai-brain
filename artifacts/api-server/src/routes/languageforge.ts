import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { languageforgeSessions } from "@workspace/db";
export default makeForgeRouter(languageforgeSessions as ForgeTable, "languageforge");
