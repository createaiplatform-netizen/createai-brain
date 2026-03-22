import { makeForgeRouter, type ForgeTable } from "../lib/forgeFactory.js";
import { narratororsSessions } from "@workspace/db";
export default makeForgeRouter(narratororsSessions as ForgeTable, "narratoros");
