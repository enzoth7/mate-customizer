import { defaultRimIconPlacement, calculateRimIconPlacement, RIM_VIEWBOX_SIZE } from "../catalog/rimGeometry";
import { rimIconCatalog } from "../catalog/rimIconCatalog";

interface RimIconLayerProps { selectedImageId: string | null }

export function RimIconLayer({ selectedImageId }: RimIconLayerProps) {
  const icon = rimIconCatalog.find((item) => item.id === selectedImageId);
  if (!icon) return null;
  const placement = calculateRimIconPlacement(defaultRimIconPlacement);
  const halfSize = defaultRimIconPlacement.size / 2;
  return (
    <svg viewBox={`0 0 ${RIM_VIEWBOX_SIZE} ${RIM_VIEWBOX_SIZE}`} className="pointer-events-none absolute inset-0 z-30 h-full w-full" aria-hidden="true">
      <image href={icon.src} x={placement.x - halfSize} y={placement.y - halfSize} width={defaultRimIconPlacement.size} height={defaultRimIconPlacement.size} transform={`rotate(${placement.rotation} ${placement.x} ${placement.y})`} preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}
