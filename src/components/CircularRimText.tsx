import { calculateRimCharacterKnockoutPadding, calculateRimCharacterLayout, rimTextGeometry, RIM_VIEWBOX_SIZE } from "../catalog/rimGeometry";

interface CircularRimTextProps { text: string }
interface RimTextFinishMaskProps { id: string; text: string }

const luminanceMaskAttribute = { "mask-type": "luminance" };

function RimCharacters({ text, mask = false }: { text: string; mask?: boolean }) {
  const layout = calculateRimCharacterLayout(text, rimTextGeometry);
  const knockoutStrokeWidth = calculateRimCharacterKnockoutPadding(layout.fontSize) * 2;
  return (
    <>
      {layout.characters.map((character, index) => character.character !== " " && (
        <text
          key={`${character.character}-${index}`}
          x={character.x}
          y={character.y}
          transform={`rotate(${character.rotation} ${character.x} ${character.y})`}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={mask ? "black" : "#1f1f1f"}
          stroke={mask ? "black" : "none"}
          strokeWidth={mask ? knockoutStrokeWidth : 0}
          strokeLinejoin="round"
          strokeLinecap="round"
          paintOrder="stroke fill"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={layout.fontSize}
          fontWeight="700"
        >
          {character.character}
        </text>
      ))}
    </>
  );
}

export function RimTextFinishMask({ id, text }: RimTextFinishMaskProps) {
  return (
    <mask id={id} {...luminanceMaskAttribute} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width={RIM_VIEWBOX_SIZE} height={RIM_VIEWBOX_SIZE}>
      <rect width={RIM_VIEWBOX_SIZE} height={RIM_VIEWBOX_SIZE} fill="white" />
      <RimCharacters text={text} mask />
    </mask>
  );
}

export function CircularRimText({ text }: CircularRimTextProps) {
  if (!text.trim()) return null;
  return (
    <RimCharacters text={text} />
  );
}
