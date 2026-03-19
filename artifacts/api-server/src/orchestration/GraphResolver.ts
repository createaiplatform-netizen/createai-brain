// ═══════════════════════════════════════════════════════════════════════════
// GRAPH RESOLVER — Phase 7: Multi-agent orchestration with dependency graph.
//
// Design:
//   • OrchestrateGraph maps node names → GraphNode (action + deps + params)
//   • validate()  — checks all deps exist, detects self-refs and cycles (DFS)
//   • levels()    — Kahn's BFS topological sort → ExecutionLevels ready for
//                   parallel execution (nodes within same level are independent)
//   • buildParams() — merges dep outputs into node params under `$deps` key
//                     so downstream nodes can access upstream results
//
// No imports from container — pure logic, zero side effects.
// ═══════════════════════════════════════════════════════════════════════════

export interface GraphNode {
  /** Must match a key in the domainActions registry in ai.ts */
  action:  string;
  /** Names of other nodes in this graph that must complete before this one */
  deps?:   string[];
  /** Params passed to the action function, merged with $deps outputs */
  params?: Record<string, unknown>;
}

export type OrchestrateGraph = Record<string, GraphNode>;

export interface ExecutionLevel {
  /** Node names that can execute in parallel (no inter-dependencies) */
  names: string[];
}

export class GraphResolver {
  // ── validate ──────────────────────────────────────────────────────────────

  /**
   * Throws if the graph contains:
   *   • A dep that references an unknown node name
   *   • A self-referencing dep (a node depends on itself)
   *   • A cycle (detected via DFS with on-stack tracking)
   */
  static validate(graph: OrchestrateGraph): void {
    const names = new Set(Object.keys(graph));

    for (const [name, node] of Object.entries(graph)) {
      for (const dep of node.deps ?? []) {
        if (!names.has(dep)) {
          throw new Error(
            `Graph node '${name}' depends on '${dep}' which is not defined in the graph. ` +
            `Available nodes: ${[...names].join(", ")}`,
          );
        }
        if (dep === name) {
          throw new Error(`Graph node '${name}' depends on itself.`);
        }
      }
    }

    const visited = new Set<string>();
    const onStack = new Set<string>();

    const dfs = (n: string): void => {
      if (onStack.has(n)) {
        throw new Error(
          `Cycle detected in orchestration graph at node '${n}'. ` +
          `Execution path: ${[...onStack].join(" → ")} → ${n}`,
        );
      }
      if (visited.has(n)) return;

      onStack.add(n);
      for (const dep of graph[n].deps ?? []) dfs(dep);
      onStack.delete(n);
      visited.add(n);
    };

    for (const n of names) dfs(n);
  }

  // ── levels ────────────────────────────────────────────────────────────────

  /**
   * Kahn's BFS topological sort.
   * Returns an ordered array of ExecutionLevels — nodes within the same level
   * are independent and safe to execute in parallel via Promise.all.
   *
   * Example: given A → B → D and A → C → D, returns:
   *   [ { names: ["A"] }, { names: ["B", "C"] }, { names: ["D"] } ]
   */
  static levels(graph: OrchestrateGraph): ExecutionLevel[] {
    const inDegree   = new Map<string, number>();
    const successors = new Map<string, string[]>();

    for (const name of Object.keys(graph)) {
      inDegree.set(name, 0);
      successors.set(name, []);
    }

    for (const [name, node] of Object.entries(graph)) {
      for (const dep of node.deps ?? []) {
        inDegree.set(name, (inDegree.get(name) ?? 0) + 1);
        successors.get(dep)!.push(name);
      }
    }

    const levels: ExecutionLevel[] = [];
    let ready = Object.keys(graph).filter(n => (inDegree.get(n) ?? 0) === 0);

    while (ready.length > 0) {
      levels.push({ names: ready });
      const next: string[] = [];

      for (const n of ready) {
        for (const s of successors.get(n) ?? []) {
          const deg = (inDegree.get(s) ?? 0) - 1;
          inDegree.set(s, deg);
          if (deg === 0) next.push(s);
        }
      }

      ready = next;
    }

    return levels;
  }

  // ── buildParams ───────────────────────────────────────────────────────────

  /**
   * Merges a node's static params with its dependency outputs.
   * Dep results are available at params.$deps.{depName} inside the action fn.
   *
   * Example: a "publish" node that depends on "generate" can read
   *   params.$deps.generate.projectId
   */
  static buildParams(
    node:    GraphNode,
    outputs: Map<string, unknown>,
  ): Record<string, unknown> {
    const $deps: Record<string, unknown> = {};
    for (const dep of node.deps ?? []) {
      $deps[dep] = outputs.get(dep);
    }
    return { ...(node.params ?? {}), $deps };
  }
}
