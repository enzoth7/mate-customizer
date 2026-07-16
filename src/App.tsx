import { useState } from "react";
import type { ReactNode } from "react";
import { MateModelSelector } from "./components/MateModelSelector";
import { MateVariantSelector } from "./components/MateVariantSelector";
import { ConfiguratorPreview } from "./components/ConfiguratorPreview";
import { RimFinishSelector } from "./components/RimFinishSelector";
import { RimIconSelector } from "./components/RimIconSelector";
import { RimImageModeSelector } from "./components/RimImageModeSelector";
import { RimMaterialSelector } from "./components/RimMaterialSelector";
import { RimTextEditor } from "./components/RimTextEditor";
import { RimTextModeSelector } from "./components/RimTextModeSelector";
import { getDefaultVariant, getModelDefinition, getVariantsByModel, mateVariants, type EngravingArea, type MateModel, type MateVariant } from "./catalog/mateCatalog";
import { createDefaultRimSelection, getCompatibleRims, normalizeRimSelection, type RimCustomization } from "./catalog/rimCatalog";

type CustomizationPhase = "mate" | "virola" | "fleje";
type PreviewView = "virola" | "fleje";

interface BaseImageProps {
  src: string;
  alt: string;
}

interface PhaseAccordionProps {
  number: number;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

interface MateConfiguration {
  modelId: MateModel;
  variantId: string;
  rim: RimCustomization;
}

function BaseImage({ src, alt }: BaseImageProps) {
  return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-contain" draggable={false} />;
}

function FlejeTextLayer({ text, engravingArea }: { text: string; engravingArea: EngravingArea | null }) {
  if (!text.trim() || !engravingArea) return null;

  const fontSize = Math.max(60, 140 - Math.max(0, text.length - 4) * 5.5);
  const letterSpacing = text.length > 12 ? 4 : 6;
  const textLength = Math.min(860, Math.max(300, text.length * fontSize * 0.62 + Math.max(0, text.length - 1) * letterSpacing));

  return (
    <div
      data-layer="fleje-text"
      className="pointer-events-none absolute overflow-hidden"
      style={{
        left: `${engravingArea.x}%`,
        top: `${engravingArea.y}%`,
        width: `${engravingArea.width}%`,
        height: `${engravingArea.height}%`,
      }}
    >
      <svg viewBox="0 0 1000 160" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
        <text
          x="500"
          y="84"
          textAnchor="middle"
          dominantBaseline="middle"
          textLength={textLength}
          lengthAdjust="spacingAndGlyphs"
          fill="#2d2d2a"
          stroke="#b8ae9d"
          strokeWidth="1.2"
          paintOrder="stroke"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={fontSize}
          fontWeight="700"
          letterSpacing={letterSpacing}
          style={{ mixBlendMode: "multiply" }}
        >
          {text.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

function FlejePreview({ mate, text }: { mate: MateVariant; text: string }) {
  const model = getModelDefinition(mate.model);
  return (
    <div className="relative aspect-square w-full max-w-[540px]" aria-label={`Vista lateral del mate ${mate.name}`}>
      <BaseImage src={mate.image} alt={`Mate ${mate.name} visto de frente`} />
      <FlejeTextLayer text={model.hasFleje ? text : ""} engravingArea={model.engravingArea} />
    </div>
  );
}

function PhaseAccordion({ number, title, isOpen, onToggle, children }: PhaseAccordionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono font-bold ${isOpen ? "bg-[#2b3e13] text-white" : "bg-zinc-100 text-zinc-500"}`}>{number}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">{title}</span>
        </div>
        <span className="text-[10px] text-zinc-400">{isOpen ? "−" : "＋"}</span>
      </button>
      <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] border-t border-zinc-100 opacity-100" : "grid-rows-[0fr] pointer-events-none opacity-0"}`}>
        <div className="overflow-hidden p-4">{children}</div>
      </div>
    </section>
  );
}

export default function App() {
  const [activePhase, setActivePhase] = useState<CustomizationPhase | null>("mate");
  const [previewView, setPreviewView] = useState<PreviewView>("fleje");
  const initialVariant = getDefaultVariant("imperial");
  const [configuration, setConfiguration] = useState<MateConfiguration>(() => ({ modelId: initialVariant.model, variantId: initialVariant.id, rim: createDefaultRimSelection(initialVariant) }));
  const [flejeText, setFlejeText] = useState("");

  const selectedMate = mateVariants.find((variant) => variant.id === configuration.variantId) ?? initialVariant;
  const selectedModelDefinition = getModelDefinition(selectedMate.model);
  const compatibleVariants = getVariantsByModel(configuration.modelId);
  const compatibleRims = getCompatibleRims(selectedMate);

  const selectModel = (model: MateModel) => {
    const defaultVariant = getDefaultVariant(model);
    setConfiguration((current) => ({ modelId: model, variantId: defaultVariant.id, rim: normalizeRimSelection(defaultVariant, current.rim) }));
    setPreviewView("fleje");
  };

  const selectVariant = (variantId: string) => {
    const variant = mateVariants.find((item) => item.id === variantId);
    if (!variant || variant.model !== configuration.modelId) return;
    setConfiguration((current) => ({ ...current, variantId: variant.id, rim: normalizeRimSelection(variant, current.rim) }));
    setPreviewView("fleje");
  };

  const activatePhase = (phase: CustomizationPhase) => {
    setActivePhase((currentPhase) => currentPhase === phase ? null : phase);
    setPreviewView(phase === "virola" ? "virola" : "fleje");
  };

  return (
    <div className="mate-theme min-h-screen overflow-x-hidden bg-transparent font-sans text-zinc-800 antialiased">
      <header className="sticky top-0 z-30 bg-[rgba(251,243,222,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl justify-center px-4 py-5">
          <div className="flex items-center gap-3">
            <img src="/logoma.jpg" alt="Matearte" className="h-12 w-12 rounded-2xl object-cover" />
            <h1 className="text-lg font-black tracking-tight text-zinc-900 sm:text-xl">Matearte</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <aside className="order-2 flex flex-col gap-3 lg:order-1 lg:col-span-5">
            <PhaseAccordion number={1} title="Mate" isOpen={activePhase === "mate"} onToggle={() => activatePhase("mate")}>
              <div className="space-y-4">
                <MateModelSelector selectedModel={configuration.modelId} onSelect={selectModel} />
                <MateVariantSelector variants={compatibleVariants} selectedVariantId={selectedMate.id} onSelect={selectVariant} />
              </div>
            </PhaseAccordion>

            <PhaseAccordion number={2} title="Virola" isOpen={activePhase === "virola"} onToggle={() => activatePhase("virola")}>
              <div className="space-y-4">
                <RimMaterialSelector rims={compatibleRims} selectedRimId={configuration.rim.rimId} onSelect={(rimId) => setConfiguration((current) => ({ ...current, rim: normalizeRimSelection(selectedMate, { ...current.rim, rimId }) }))} />
                <RimFinishSelector selectedFinishId={configuration.rim.finishId} onSelect={(finishId) => setConfiguration((current) => ({ ...current, rim: { ...current.rim, finishId } }))} />
                <RimTextModeSelector mode={configuration.rim.textMode} onSelect={(textMode) => setConfiguration((current) => ({ ...current, rim: { ...current.rim, textMode } }))} />
                {configuration.rim.textMode === "text" && <RimTextEditor value={configuration.rim.text} disabled={false} onChange={(text) => setConfiguration((current) => ({ ...current, rim: { ...current.rim, text } }))} />}
                <RimImageModeSelector mode={configuration.rim.imageMode} onSelect={(imageMode) => setConfiguration((current) => ({ ...current, rim: { ...current.rim, imageMode } }))} />
                {configuration.rim.imageMode === "image" && <RimIconSelector selectedImageId={configuration.rim.selectedImageId} onSelect={(selectedImageId) => setConfiguration((current) => ({ ...current, rim: { ...current.rim, selectedImageId } }))} />}
              </div>
            </PhaseAccordion>

            <PhaseAccordion number={3} title="Fleje" isOpen={activePhase === "fleje"} onToggle={() => activatePhase("fleje")}>
              {selectedModelDefinition.hasFleje ? (
                <label className="block">
                  <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-zinc-400">Texto en fleje</span>
                  <input
                    type="text"
                    value={flejeText}
                    onChange={(event) => setFlejeText(event.target.value.slice(0, 20))}
                    maxLength={20}
                    placeholder="Escribí tu texto"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-[#7a4a31]"
                  />
                  <span className="mt-1 block text-right text-[9px] font-medium text-zinc-400">{flejeText.length} / 20</span>
                </label>
              ) : (
                <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-[10px] leading-relaxed text-zinc-500">El mate Camionero no tiene fleje metálico para grabado.</p>
              )}
            </PhaseAccordion>
          </aside>

          <section className="order-1 flex min-h-[620px] w-full flex-col lg:order-2 lg:col-span-7">
            <div className="mb-5 flex self-center rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
              <button type="button" onClick={() => setPreviewView("virola")} className={`rounded-lg px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${previewView === "virola" ? "bg-[#2b3e13] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}>Virola</button>
              <button type="button" onClick={() => setPreviewView("fleje")} className={`rounded-lg px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${previewView === "fleje" ? "bg-[#2b3e13] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}>Fleje</button>
            </div>

            <div className="flex min-h-[560px] flex-1 items-center justify-center rounded-3xl border border-zinc-200/80 bg-white/50 p-8 shadow-sm sm:p-12" aria-label="Vista previa del mate">
              {previewView === "virola" ? <ConfiguratorPreview rim={configuration.rim} /> : <FlejePreview mate={selectedMate} text={flejeText} />}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
