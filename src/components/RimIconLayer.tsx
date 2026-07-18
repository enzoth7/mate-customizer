import { useId } from "react";
import { defaultRimIconPlacement, calculateRimIconPlacement, RIM_ICON_KNOCKOUT_COLOR, RIM_ICON_KNOCKOUT_SIZE } from "../catalog/rimGeometry";
import { rimIconCatalog } from "../catalog/rimIconCatalog";

interface RimIconLayerProps { selectedImageId: string | null }

export function RimIconLayer({ selectedImageId }: RimIconLayerProps) {
  const knockoutFilterId = `rim-icon-knockout-${useId().replace(/:/g, "")}`;
  const icon = rimIconCatalog.find((item) => item.id === selectedImageId);
  if (!icon) return null;
  const placement = calculateRimIconPlacement(defaultRimIconPlacement);
  const halfSize = defaultRimIconPlacement.size / 2;
  return (
    <>
      <defs>
        <filter id={knockoutFilterId} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={RIM_ICON_KNOCKOUT_SIZE} result="expanded-alpha" />
          <feComponentTransfer in="expanded-alpha" result="solid-alpha">
            <feFuncA type="table" tableValues="0 1" />
          </feComponentTransfer>
          <feFlood floodColor={RIM_ICON_KNOCKOUT_COLOR} result="knockout-color" />
          <feComposite in="knockout-color" in2="solid-alpha" operator="in" />
        </filter>
      </defs>
      <image href={icon.src} x={placement.x - halfSize} y={placement.y - halfSize} width={defaultRimIconPlacement.size} height={defaultRimIconPlacement.size} transform={`rotate(${placement.rotation} ${placement.x} ${placement.y})`} preserveAspectRatio="xMidYMid meet" filter={`url(#${knockoutFilterId})`} />
      <image href={icon.src} x={placement.x - halfSize} y={placement.y - halfSize} width={defaultRimIconPlacement.size} height={defaultRimIconPlacement.size} transform={`rotate(${placement.rotation} ${placement.x} ${placement.y})`} preserveAspectRatio="xMidYMid meet" />
    </>
  );
}
