// FILE: src/ui/CosmicHome.tsx
import React from "react";
import { universeIndex } from "../reality/universeIndex";
import { Layout } from "./Layout";

const Section: React.FC<{ label: string; items: string[] }> = ({ label, items }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map(item => (
        <span
          key={item}
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            background: "#111827",
            border: "1px solid #1f2937",
            fontSize: 11
          }}
        >
          {item}
        </span>
      ))}
    </div>
  </div>
);

export const CosmicHome: React.FC = () => (
  <Layout title="Cosmic Index">
    <Section label="Absolute Layer"    items={[universeIndex.absolute]}        />
    <Section label="Meta-Reality"      items={universeIndex.metaReality}       />
    <Section label="Reality Stack"     items={universeIndex.realityStack}      />
    <Section label="Internal Internet" items={universeIndex.internalInternet}  />
    <Section label="Engines"           items={universeIndex.engines}           />
    <Section label="Apps"              items={universeIndex.apps}              />
  </Layout>
);
