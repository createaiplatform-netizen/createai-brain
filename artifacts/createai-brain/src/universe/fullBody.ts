// ============================================================
// FILE: src/universe/fullBody.ts
// Full Body — runs all layers in sequence on an event
// ============================================================

import { circulate }      from "./circulationLayer";
import { sense }          from "./sensingLayer";
import { respond }        from "./responseLayer";
import { continuity }     from "./continuityLayer";
import { express }        from "./expressionLayer";
import { interact }       from "./interactionLayer";
import { ecosystem }      from "./ecosystemLayer";
import { autonomous }     from "./autonomyLayer";
import { expand }         from "./expansionLayer";
import { multiply }       from "./multiplicityLayer";
import { reflect }        from "./reflectionLayer";
import { narrate }        from "./narrativeLayer";
import { meaning }        from "./meaningLayer";
import { presenceExpand } from "./presenceExpansionLayer";
import { agency }         from "./agencyLayer";
import { whole }          from "./wholenessLayer";
import { emerge }         from "./emergenceLayer";
import { identity }       from "./identityLayer";
import { relate }         from "./relationshipLayer";
import { worldhood }      from "./worldhoodLayer";

export function fullBody(event: any) {
  let state: any = circulate(event);
  state = sense(state);
  state = respond(state);
  state = continuity(state);
  state = express(state);
  state = interact(event, state);
  state = ecosystem(state);
  state = autonomous(state);
  state = expand(state);
  state = multiply(state);
  state = reflect(state);
  state = narrate(state);
  state = meaning(state);
  state = presenceExpand(state);
  state = agency(state);
  state = whole(state);
  state = emerge(state);
  state = identity(state);
  state = relate(state);
  state = worldhood(state);
  return state;
}
