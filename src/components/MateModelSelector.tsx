import { mateModels, type MateModel } from "../catalog/mateCatalog";

interface MateModelSelectorProps {
  selectedModel: MateModel;
  onSelect: (model: MateModel) => void;
}

export function MateModelSelector({ selectedModel, onSelect }: MateModelSelectorProps) {
  return (
    <div>
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-zinc-400">Tipo de mate</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {mateModels.map((model) => {
          const isSelected = model.id === selectedModel;
          return (
            <button key={model.id} type="button" onClick={() => onSelect(model.id)} aria-pressed={isSelected} className={`rounded-xl border px-3 py-3 text-center text-[10px] font-bold transition-all ${isSelected ? "border-[#2b3e13] bg-[#2b3e13]/5 text-[#2b3e13] ring-1 ring-[#2b3e13]/25" : "border-zinc-200 bg-white text-zinc-700 hover:border-[#7a4a31]"}`}>
              {model.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
