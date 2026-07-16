import type { MateVariant } from "../catalog/mateCatalog";

interface MateVariantSelectorProps {
  variants: MateVariant[];
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
}

export function MateVariantSelector({ variants, selectedVariantId, onSelect }: MateVariantSelectorProps) {
  return (
    <div>
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-zinc-400">Variante base</span>
      <div className="grid max-h-[370px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          return (
            <button key={variant.id} type="button" onClick={() => onSelect(variant.id)} aria-pressed={isSelected} className={`rounded-xl border p-2 text-center transition-all ${isSelected ? "border-[#2b3e13] bg-[#2b3e13]/5 ring-1 ring-[#2b3e13]/25" : "border-zinc-200 bg-white hover:border-[#7a4a31]"}`}>
              <img src={variant.image} alt={variant.name} className="mx-auto aspect-square w-full rounded-lg object-contain" loading="lazy" draggable={false} />
              <span className={`mt-1 block text-[9px] font-bold leading-tight ${isSelected ? "text-[#2b3e13]" : "text-zinc-700"}`}>{variant.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
