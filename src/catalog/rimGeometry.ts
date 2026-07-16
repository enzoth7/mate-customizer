export interface RimTextGeometry {
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  fontSize: number;
}

export interface RimIconPlacement {
  angle: number;
  radius: number;
  size: number;
  rotationMode: "tangent" | "upright";
}

export const RIM_VIEWBOX_SIZE = 1254;
export const rimTextGeometry: RimTextGeometry = { centerX: 627, centerY: 627, radius: 520, startAngle: 205, endAngle: 335, fontSize: 42 };
export const defaultRimIconPlacement: RimIconPlacement = { angle: 25, radius: 515, size: 72, rotationMode: "upright" };

export function polarPoint(centerX: number, centerY: number, radius: number, angle: number) {
  const radians = angle * Math.PI / 180;
  return { x: centerX + Math.cos(radians) * radius, y: centerY + Math.sin(radians) * radius };
}

export function createArcPath(geometry: RimTextGeometry): string {
  const start = polarPoint(geometry.centerX, geometry.centerY, geometry.radius, geometry.startAngle);
  const end = polarPoint(geometry.centerX, geometry.centerY, geometry.radius, geometry.endAngle);
  const angleSpan = ((geometry.endAngle - geometry.startAngle) % 360 + 360) % 360;
  return `M ${start.x} ${start.y} A ${geometry.radius} ${geometry.radius} 0 ${angleSpan > 180 ? 1 : 0} 1 ${end.x} ${end.y}`;
}

export function calculateRimIconPlacement(placement: RimIconPlacement) {
  const point = polarPoint(rimTextGeometry.centerX, rimTextGeometry.centerY, placement.radius, placement.angle);
  const rotation = placement.rotationMode === "tangent" ? placement.angle + 90 : 0;
  return { x: point.x, y: point.y, rotation };
}
