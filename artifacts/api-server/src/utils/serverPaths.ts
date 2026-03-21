import path from "path";
import fs from "fs";

function resolveApiServerRoot(): string {
  const cwdPkg = path.join(process.cwd(), "package.json");
  if (fs.existsSync(cwdPkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(cwdPkg, "utf-8")) as { name?: string };
      if (pkg.name === "@workspace/api-server") {
        return process.cwd();
      }
    } catch {}
  }

  const fromWorkspaceRoot = path.join(process.cwd(), "artifacts", "api-server");
  if (fs.existsSync(fromWorkspaceRoot)) {
    return fromWorkspaceRoot;
  }

  const fromDist = path.join(process.cwd(), "..");
  const distPkg = path.join(fromDist, "package.json");
  if (fs.existsSync(distPkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(distPkg, "utf-8")) as { name?: string };
      if (pkg.name === "@workspace/api-server") {
        return fromDist;
      }
    } catch {}
  }

  return process.cwd();
}

export const API_SERVER_ROOT = resolveApiServerRoot();

export function serverPath(...segments: string[]): string {
  return path.join(API_SERVER_ROOT, ...segments);
}

export function workspaceRoot(): string {
  const fromApiServer = path.join(API_SERVER_ROOT, "..", "..");
  if (fs.existsSync(path.join(fromApiServer, "artifacts"))) {
    return fromApiServer;
  }
  const fromCwd = process.cwd();
  if (fs.existsSync(path.join(fromCwd, "artifacts"))) {
    return fromCwd;
  }
  return fromApiServer;
}
