import { Router } from "express";

import { getConnectivityMap }                      from "../../../createai-brain/src/universe/connectivityMap";
import { getContinuum, getContinuumRegistry, getContinuumRelations, getContinuumChannels } from "../../../createai-brain/src/universe/continuum";
import { getContinuumChannels as getContinuumChannelsAlt }  from "../../../createai-brain/src/universe/continuumChannels";
import { inspectContinuum, formatContinuumSummary }         from "../../../createai-brain/src/universe/continuumInspector";
import { getContinuumRelations as getContinuumRelationsAlt } from "../../../createai-brain/src/universe/continuumRouter";
import { creationStoryManifest }                   from "../../../createai-brain/src/universe/creationStoryManifest";
import { experienceLayer }                          from "../../../createai-brain/src/universe/experienceLayer";
import { familyUniverse }                           from "../../../createai-brain/src/universe/familyUniverse";
import { firstEntryExperience }                     from "../../../createai-brain/src/universe/firstEntryExperience";
import { firstMoment }                              from "../../../createai-brain/src/universe/firstMoment";
import { firstWorld }                               from "../../../createai-brain/src/universe/firstWorld";
import { kidsUniverse }                             from "../../../createai-brain/src/universe/kidsUniverse";
import { universeOSMasterManifest }                 from "../../../createai-brain/src/universe/universeOSMasterManifest";
import { universePageManifest }                     from "../../../createai-brain/src/universe/universePageManifest";
import { absoluteLayer }                            from "../../../createai-brain/src/reality/absoluteLayer";
import { activationMap }                            from "../../../createai-brain/src/reality/activationMap";
import { orchestratorLayer }                        from "../../../createai-brain/src/reality/orchestratorLayer";
import { realityStack }                             from "../../../createai-brain/src/reality/realityStack";
import { universeIndex }                            from "../../../createai-brain/src/reality/universeIndex";
import { ineffableLayerManifest }                   from "../../../createai-brain/src/self/ineffableLayerManifest";
import { selfGeneratingLayerManifest }              from "../../../createai-brain/src/self/selfGeneratingLayerManifest";
import { transcendentalLayerManifest }              from "../../../createai-brain/src/self/transcendentalLayerManifest";

const router = Router();

router.get("/connectivity-map",          (_req, res) => res.json(getConnectivityMap()));
router.get("/continuum",                 (_req, res) => res.json(getContinuum()));
router.get("/continuum/registry",        (_req, res) => res.json(getContinuumRegistry()));
router.get("/continuum/relations",       (_req, res) => res.json(getContinuumRelations()));
router.get("/continuum/channels",        (_req, res) => res.json(getContinuumChannels()));
router.get("/continuum-channels",        (_req, res) => res.json(getContinuumChannelsAlt()));
router.get("/continuum-relations",       (_req, res) => res.json(getContinuumRelationsAlt()));
router.get("/continuum/inspect",         (_req, res) => {
  const summary = inspectContinuum(getContinuum(), getContinuumRegistry());
  res.json({ summary, formatted: formatContinuumSummary(summary) });
});
router.get("/creation-story",            (_req, res) => res.json(creationStoryManifest));
router.get("/experience-layer",          (_req, res) => res.json(experienceLayer));
router.get("/family-universe",           (_req, res) => res.json(familyUniverse));
router.get("/first-entry-experience",    (_req, res) => res.json(firstEntryExperience));
router.get("/first-moment",              (_req, res) => res.json(firstMoment));
router.get("/first-world",               (_req, res) => res.json(firstWorld));
router.get("/kids-universe",             (_req, res) => res.json(kidsUniverse));
router.get("/master-manifest",           (_req, res) => res.json(universeOSMasterManifest));
router.get("/page-manifest",             (_req, res) => res.json(universePageManifest));
router.get("/reality/absolute-layer",    (_req, res) => res.json(absoluteLayer));
router.get("/reality/activation-map",    (_req, res) => res.json(activationMap));
router.get("/reality/orchestrator",      (_req, res) => res.json(orchestratorLayer));
router.get("/reality/stack",             (_req, res) => res.json(realityStack));
router.get("/reality/index",             (_req, res) => res.json(universeIndex));
router.get("/self/ineffable",            (_req, res) => res.json(ineffableLayerManifest));
router.get("/self/self-generating",      (_req, res) => res.json(selfGeneratingLayerManifest));
router.get("/self/transcendental",       (_req, res) => res.json(transcendentalLayerManifest));

export default router;
