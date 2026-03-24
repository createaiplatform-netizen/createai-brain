// FILE: src/protocol/universeProtocol.ts
import { universeIndex } from "../reality/universeIndex";

export type UniverseURL = `universe://${string}`;

export const universeProtocol = {
  resolve(url: UniverseURL) {
    const path = url.replace("universe://", "");
    if (path === "" || path === "home")   return { type: "index",   data: universeIndex };
    if (path.startsWith("apps/"))         return { type: "app",     id: path.slice(5)  };
    if (path.startsWith("engines/"))      return { type: "engine",  id: path.slice(8)  };
    if (path.startsWith("reality/"))      return { type: "reality", id: path.slice(8)  };
    if (path.startsWith("absolute"))      return { type: "absolute"                    };
    return { type: "unknown", path };
  }
};
