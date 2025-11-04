import localforage from "localforage";

// Dynamic, SSR-safe Automerge import
let Automerge: any = null;

if (typeof window !== "undefined") {
  import("@automerge/automerge")
    .then((m) => {
      Automerge = m;
      console.info("[FILON] Automerge dynamically loaded");
    })
    .catch((err) => console.warn("[FILON] Automerge load failed:", err));
} else {
  console.info("[FILON] SSR context — Automerge disabled");
}

export type GraphDoc = any;

export async function initGraphDoc(): Promise<GraphDoc> {
  if (!Automerge) {
    console.warn("[FILON] Automerge not loaded — initGraphDoc skipped");
    return null;
  }

  try {
    const saved = await localforage.getItem<Uint8Array>("noion-graph-doc");
    if (saved) {
      return Automerge.load(saved);
    }
    const doc = Automerge.init();
    const next = Automerge.change(doc, (d: any) => {
      d.nodes = [];
      d.edges = [];
    });
    await persistGraphDoc(next);
    return next;
  } catch (err) {
    console.error("[FILON] Automerge runtime error in initGraphDoc:", err);
    return null;
  }
}

export async function persistGraphDoc(doc: GraphDoc) {
  if (!Automerge) {
    console.warn("[FILON] Automerge not loaded — persistGraphDoc skipped");
    return;
  }

  try {
    const binary = Automerge.save(doc);
    await localforage.setItem("noion-graph-doc", binary);
  } catch (err) {
    console.error("[FILON] Automerge runtime error in persistGraphDoc:", err);
  }
}

export async function mergeRemoteDoc(
  local: GraphDoc,
  remoteBinary: Uint8Array
) {
  if (!Automerge) {
    console.warn("[FILON] Automerge not loaded — mergeRemoteDoc skipped");
    return null;
  }

  try {
    const remote = Automerge.load(remoteBinary);
    const merged = Automerge.merge(local, remote);
    await persistGraphDoc(merged);
    return merged;
  } catch (err) {
    console.error("[FILON] Automerge runtime error in mergeRemoteDoc:", err);
    return null;
  }
}
