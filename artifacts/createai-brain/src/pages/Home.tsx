import React from "react";
import { OSProvider } from "@/os/OSContext";
import { OSLayout } from "@/os/osLayout";

export default function Home() {
  return (
    <OSProvider>
      <OSLayout />
    </OSProvider>
  );
}
