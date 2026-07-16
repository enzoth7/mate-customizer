import { useState } from "react";
import { MAX_RIM_TEXT_LENGTH, sanitizeRimText } from "../catalog/rimCatalog";

interface RimTextEditorProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function RimTextEditor({ value, disabled, onChange }: RimTextEditorProps) {
  const [limitReached, setLimitReached] = useState(false);

  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-zinc-400">Texto de virola</span>
      <input type="text" value={value} disabled={disabled} onChange={(event) => {
        const sanitized = sanitizeRimText(event.target.value);
        if (sanitized.length > MAX_RIM_TEXT_LENGTH) {
          setLimitReached(true);
          return;
        }
        setLimitReached(false);
        onChange(sanitized);
      }} placeholder={disabled ? "Seleccioná Con texto para escribir" : "Escribí tu texto"} aria-describedby="rim-text-status" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-[#7a4a31] disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" />
      <span id="rim-text-status" className={`mt-1 flex justify-between text-[9px] font-medium ${limitReached ? "text-red-600" : "text-zinc-400"}`}><span>{limitReached ? `Máximo ${MAX_RIM_TEXT_LENGTH} caracteres` : "Los espacios repetidos se normalizan"}</span><span>{value.length} / {MAX_RIM_TEXT_LENGTH}</span></span>
    </label>
  );
}
