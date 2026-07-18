import { defaultRimIconPlacement, calculateRimIconPlacement } from "../catalog/rimGeometry";
import { rimIconCatalog } from "../catalog/rimIconCatalog";

interface RimIconLayerProps { selectedImageId: string | null }

export function RimIconLayer({ selectedImageId }: RimIconLayerProps) {
  const icon = rimIconCatalog.find((item) => item.id === selectedImageId);
  if (!icon) return null;
  const placement = calculateRimIconPlacement(defaultRimIconPlacement);
  const halfSize = defaultRimIconPlacement.size / 2;
  
  return (
    <>
      <circle cx={placement.x} cy={placement.y} r={85} fill="#EAE4DC" />
      <image 
        href={icon.src} 
        x={placement.x - halfSize} 
        y={placement.y - halfSize} 
        width={defaultRimIconPlacement.size} 
        height={defaultRimIconPlacement.size} 
        transform={`rotate(${placement.rotation} ${placement.x} ${placement.y})`} 
        preserveAspectRatio="xMidYMid meet" 
      />
    </>
  );
}
