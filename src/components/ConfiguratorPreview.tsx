import { useState } from "react";
import { getRimFinish } from "../catalog/rimFinishCatalog";
import { rimVisualAsset } from "../catalog/previewCatalog";
import type { RimCustomization } from "../catalog/rimCatalog";
import { CircularRimText } from "./CircularRimText";
import { RimIconLayer } from "./RimIconLayer";

interface ConfiguratorPreviewProps { rim: RimCustomization }

export function ConfiguratorPreview({ rim }: ConfiguratorPreviewProps) {
  const finish = getRimFinish(rim.finishId);
  const [failedFinishId, setFailedFinishId] = useState<string | null>(null);
  return (
    <div className="relative aspect-square w-full max-w-[540px] overflow-hidden" aria-label="Vista editable de la virola">
      <img src={rimVisualAsset.image} alt="Virola editable vista desde arriba" className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain" draggable={false} />
      {finish?.image && failedFinishId !== finish.id && <img src={finish.image} alt="" className="pointer-events-none absolute inset-0 z-20 h-full w-full object-contain" onLoad={() => setFailedFinishId(null)} onError={() => setFailedFinishId(finish.id)} draggable={false} />}
      {rim.imageMode === "image" && <RimIconLayer selectedImageId={rim.selectedImageId} />}
      {rim.textMode === "text" && <CircularRimText text={rim.text} />}
    </div>
  );
}
