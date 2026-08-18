import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { processGroups, allStages, type ProcessStage } from "@/data/metallurgyProcess";
import { StageDetailPanel } from "@/components/metallurgy-map/StageDetailPanel";
import { ProcessFlowMap } from "@/components/metallurgy-map/ProcessFlowMap";

export default function MetallurgyMap() {
  const [selectedStage, setSelectedStage] = useState<ProcessStage | null>(null);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🗺️</span>
            <h1 className="text-2xl font-bold text-foreground">Steel Production Process Map</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            Explore the complete steelmaking journey — click any stage to learn more, find courses, resources & experts.
          </p>
        </div>

        {/* Flow Map */}
        <div className="px-8 pb-4">
          <ProcessFlowMap
            groups={processGroups}
            selectedId={selectedStage?.id ?? null}
            onSelect={(id) => {
              const stage = allStages.find((s) => s.id === id) ?? null;
              setSelectedStage(stage);
            }}
          />
        </div>

        {/* Detail Panel */}
        {selectedStage && (
          <div className="px-8 pb-8">
            <StageDetailPanel
              stage={selectedStage}
              onClose={() => setSelectedStage(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
