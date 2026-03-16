import React from "react";
import { useParams } from "wouter";
import { CreationStore } from "@/standalone/creation/CreationStore";
import { CreationViewer } from "@/standalone/creation/CreationViewer";

export default function CreationPage() {
  const params = useParams<{ creationId: string }>();
  const creation = CreationStore.get(params.creationId ?? "");

  if (!creation) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground font-sans">
        <p className="text-5xl">✨</p>
        <h1 className="text-xl font-bold">Creation Not Found</h1>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          This creation may have expired or hasn't been built yet. Return to the OS and build it first.
        </p>
        <div className="flex gap-3 mt-4">
          <button onClick={() => window.close()}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">
            Close Tab
          </button>
          <button onClick={() => window.history.back()}
            className="border border-border/50 text-muted-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <CreationViewer creation={creation} />;
}
