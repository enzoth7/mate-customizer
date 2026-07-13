import { useState, useEffect } from "react";

import { Upload, Sparkles, Wrench, AlertTriangle, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { 
  getOpenAIApiKey,
  saveTempApiKey,
  listAvailableModels,
  testGptModel,
  testDallEModel,
  generateDynamicPromptWithVision
} from "./services/openaiService";
import type { OpenAIRequest } from "./services/openaiService";
import {
  generateMateInpainting,
  getFalApiKey,
  saveTempFalKey,
  testFalConnection
} from "./services/falService";

// Tipos
type ModeloMate = "imperial" | "torpedo" | "camionero";
type EstiloTexto = "bronce_relieve" | "laser_quemado";

interface MateRealConfig {
  key: string;
  src: string;
  label: string;
  modelo: ModeloMate;
  // Valores iniciales calibrados al milímetro para cada foto
  defaultCenterY: number;
  defaultRadiusX: number;
  defaultRadiusY: number;
  defaultFlejeCenterY?: number;
  defaultFlejeRadiusX?: number;
  defaultFlejeRadiusY?: number;
}

const BRAND = {
  brown: "#7a4a31",
  brownDark: "#5f3826",
  cream: "#f3e1b9",
  creamSoft: "#fbf3de",
  ink: "#2d1d14",
} as const;

const VIROLA_OPTIONS = [
  {
    key: "virola1",
    src: "/assets/flejes_virolas/virola1.png",
    label: "Virola 1",
  },
  {
    key: "virola2",
    src: "/assets/flejes_virolas/virola2.png",
    label: "Virola 2",
  },
  {
    key: "virola3",
    src: "/assets/flejes_virolas/virola3.png",
    label: "Virola 3",
  },
] as const;

const FLEJE_OPTIONS = [
  {
    key: "fleje1",
    src: "/assets/flejes_virolas/fleje1.png",
    label: "Fleje 1",
  },
  {
    key: "fleje2",
    src: "/assets/flejes_virolas/fleje2.png",
    label: "Fleje 2",
  },
  {
    key: "fleje3",
    src: "/assets/flejes_virolas/fleje3.png",
    label: "Fleje 3",
  },
  {
    key: "fleje4",
    src: "/assets/flejes_virolas/fleje4.png",
    label: "Fleje 4",
  },
  {
    key: "fleje5",
    src: "/assets/flejes_virolas/fleje5.png",
    label: "Fleje 5",
  },
] as const;



const MATES_REALES: Record<string, MateRealConfig> = {
  imperial_1: {
    key: "imperial_1",
    src: "/assets/imperial_1_1024x1024.webp",
    label: "Imperial Marrón Premium",
    modelo: "imperial",
    defaultCenterY: 178,
    defaultRadiusX: 114,
    defaultRadiusY: 34,
    defaultFlejeCenterY: 334,
    defaultFlejeRadiusX: 68,
    defaultFlejeRadiusY: 16,
  },
  imperial_base_circular: {
    key: "imperial_base_circular",
    src: "/assets/imperial-base-circular_1024x1024.webp",
    label: "Imperial Base Circular Negro",
    modelo: "imperial",
    defaultCenterY: 180,
    defaultRadiusX: 112,
    defaultRadiusY: 34,
    defaultFlejeCenterY: 334,
    defaultFlejeRadiusX: 66,
    defaultFlejeRadiusY: 16,
  },
  impr_ceram_liso: {
    key: "impr_ceram_liso",
    src: "/assets/impr-ceram-c_liso_1024x1024.webp",
    label: "Imperial Cerámica Negro",
    modelo: "imperial",
    defaultCenterY: 173,
    defaultRadiusX: 112,
    defaultRadiusY: 32,
    defaultFlejeCenterY: 312,
    defaultFlejeRadiusX: 70,
    defaultFlejeRadiusY: 16,
  },
  impr_ceram_liso2: {
    key: "impr_ceram_liso2",
    src: "/assets/impr-ceram-c_liso2_1024x1024.webp",
    label: "Imperial Cerámica Marrón",
    modelo: "imperial",
    defaultCenterY: 173,
    defaultRadiusX: 112,
    defaultRadiusY: 32,
    defaultFlejeCenterY: 312,
    defaultFlejeRadiusX: 70,
    defaultFlejeRadiusY: 16,
  },
  torpedo_base: {
    key: "torpedo_base",
    src: "/assets/torpedo_1024x1024.webp",
    label: "Torpedo Suela Clásico",
    modelo: "torpedo",
    defaultCenterY: 178,
    defaultRadiusX: 104,
    defaultRadiusY: 32,
  },
  torpedo_1: {
    key: "torpedo_1",
    src: "/assets/torpedo_1_1024x1024.webp",
    label: "Torpedo Negro Premium",
    modelo: "torpedo",
    defaultCenterY: 178,
    defaultRadiusX: 102,
    defaultRadiusY: 32,
  },
  torpedo_2: {
    key: "torpedo_2",
    src: "/assets/torpedo_2_1024x1024.webp",
    label: "Torpedo Marrón Rústico",
    modelo: "torpedo",
    defaultCenterY: 178,
    defaultRadiusX: 102,
    defaultRadiusY: 32,
  },
  torpedo_3: {
    key: "torpedo_3",
    src: "/assets/torpedo_3_1024x1024.webp",
    label: "Torpedo Labrado Moro",
    modelo: "torpedo",
    defaultCenterY: 174,
    defaultRadiusX: 102,
    defaultRadiusY: 32,
  },
  camionero_2: {
    key: "camionero_2",
    src: "/assets/camionero_2_1024x1024.webp",
    label: "Camionero Marrón Moro",
    modelo: "camionero",
    defaultCenterY: 175,
    defaultRadiusX: 114,
    defaultRadiusY: 34,
  },
  camionero_3: {
    key: "camionero_3",
    src: "/assets/camionero_3_1024x1024.webp",
    label: "Camionero Suela",
    modelo: "camionero",
    defaultCenterY: 180,
    defaultRadiusX: 112,
    defaultRadiusY: 32,
  }
};



export default function App() {
  // Configuración de Mates Reales
  const [selectedMateKey, setSelectedMateKey] = useState<string>("imperial_1");
  const mateConfig = MATES_REALES[selectedMateKey];
  const [selectedVirolaKey, setSelectedVirolaKey] = useState<string>(VIROLA_OPTIONS[0].key);
  const selectedVirola = VIROLA_OPTIONS.find((virola) => virola.key === selectedVirolaKey) ?? VIROLA_OPTIONS[0];
  const [selectedFlejeKey, setSelectedFlejeKey] = useState<string>(FLEJE_OPTIONS[0].key);
  const selectedFleje = FLEJE_OPTIONS.find((fleje) => fleje.key === selectedFlejeKey) ?? FLEJE_OPTIONS[0];

  // Estados de Personalización
  const [textoVirola, setTextoVirola] = useState<string>("CHRISTIAN   KAREN");
  const [textoFleje, setTextoFleje] = useState<string>("323");
  const [virolaMetal, setVirolaMetal] = useState<"alpaca" | "bronce">("alpaca");
  const [estiloTextoVirola, setEstiloTextoVirola] = useState<EstiloTexto>("bronce_relieve");
  const [estiloTextoFleje, setEstiloTextoFleje] = useState<EstiloTexto>("bronce_relieve");

  // Modo de contenido de boquilla y fleje: texto / logo independientes
  const [boquillaIncluyeTexto, setBoquillaIncluyeTexto] = useState<boolean>(true);
  const [boquillaIncluyeLogo, setBoquillaIncluyeLogo] = useState<boolean>(false);
  const [flejeIncluyeTexto, setFlejeIncluyeTexto] = useState<boolean>(true);
  const [flejeIncluyeLogo, setFlejeIncluyeLogo] = useState<boolean>(false);

  // Imágenes subidas para boquilla y fleje por separado
  const [logoBoquillaUrl, setLogoBoquillaUrl] = useState<string | null>(null);
  const [logoFlejeUrl, setLogoFlejeUrl] = useState<string | null>(null);

  // Estados de UI
  const [activeStep, setActiveStep] = useState<number>(1);
  const [mateFilter, setMateFilter] = useState<ModeloMate>("imperial");

  // Estados de IA Generativa
  const [iaGenerating, setIaGenerating] = useState<boolean>(false);
  const [iaStep, setIaStep] = useState<number>(0);
  const [iaGeneratedMateUrl, setIaGeneratedMateUrl] = useState<string | null>(null);
  const [iaGeneratedVirolaUrl, setIaGeneratedVirolaUrl] = useState<string | null>(null);
  const [lastPromptUsed, setLastPromptUsed] = useState<string>("");

  // Estados para Diagnóstico de API (QA)
  const [showDebugModal, setShowDebugModal] = useState<boolean>(false);
  const [debugApiKey, setDebugApiKey] = useState<string>(getOpenAIApiKey());
  const [debugFalApiKey, setDebugFalApiKey] = useState<string>(getFalApiKey());
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [debugStatus, setDebugStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [modelTestResults, setModelTestResults] = useState<{
    gptMini: { status: "idle" | "success" | "error"; message: string };
    dalle3: { status: "idle" | "success" | "error"; message: string; url?: string };
    falInpaint: { status: "idle" | "success" | "error"; message: string };
  }>({
    gptMini: { status: "idle", message: "" },
    dalle3: { status: "idle", message: "" },
    falInpaint: { status: "idle", message: "" },
  });

  const runDiagnostics = async (customKey?: string, customFalKey?: string) => {
    const keyToUse = customKey || debugApiKey;
    const falKeyToUse = customFalKey || debugFalApiKey;

    setDebugStatus("running");
    setDebugLogs([
      "🚀 Iniciando diagnóstico de APIs...", 
      `Clave OpenAI: sk-...${keyToUse ? keyToUse.slice(-4) : "vacía"}`, 
      `Clave Fal.ai: fal-...${falKeyToUse ? falKeyToUse.slice(-4) : "vacía"}`
    ]);
    setAvailableModels([]);
    setModelTestResults({
      gptMini: { status: "idle", message: "" },
      dalle3: { status: "idle", message: "" },
      falInpaint: { status: "idle", message: "" },
    });

    if (!keyToUse) {
      setDebugLogs((prev) => [...prev, "❌ Error: API Key de OpenAI vacía."]);
      setDebugStatus("error");
      return;
    }

    // 1. Obtener Modelos OpenAI
    try {
      setDebugLogs((prev) => [...prev, "🔄 Consultando endpoint /v1/models de OpenAI..."]);
      const models = await listAvailableModels(keyToUse);
      setAvailableModels(models);
      
      const hasDalle3 = models.includes("dall-e-3");
      const hasGpt4 = models.includes("gpt-4o-mini");
      
      setDebugLogs((prev) => [
        ...prev,
        `✅ Conexión a modelos OpenAI exitosa. Se encontraron ${models.length} modelos.`,
        `Modelos de interés: ${hasDalle3 ? "🟢 dall-e-3 (Disponible)" : "🔴 dall-e-3 (NO DISPONIBLE)"}, ${hasGpt4 ? "🟢 gpt-4o-mini (Disponible)" : "🔴 gpt-4o-mini (NO DISPONIBLE)"}`
      ]);
    } catch (err: any) {
      console.error(err);
      setDebugLogs((prev) => [...prev, `❌ Error al listar modelos OpenAI: ${err.message}`]);
      setDebugStatus("error");
      return;
    }

    // 2. Probar GPT-4o-mini
    try {
      setDebugLogs((prev) => [...prev, "🔄 Probando chat completion con gpt-4o-mini..."]);
      const text = await testGptModel(keyToUse);
      setModelTestResults((prev) => ({
        ...prev,
        gptMini: { status: "success", message: `Conexión exitosa. Respuesta: "${text}"` }
      }));
      setDebugLogs((prev) => [...prev, "✅ GPT-4o-mini funcionando correctamente."]);
    } catch (err: any) {
      console.error(err);
      setModelTestResults((prev) => ({
        ...prev,
        gptMini: { status: "error", message: err.message }
      }));
      setDebugLogs((prev) => [...prev, `❌ Error en GPT-4o-mini: ${err.message}`]);
    }

    // 3. Probar DALL-E 3 (OpenAI)
    try {
      setDebugLogs((prev) => [...prev, "🔄 Probando generación de imagen de prueba con DALL-E 3..."]);
      const url = await testDallEModel(keyToUse);
      setModelTestResults((prev) => ({
        ...prev,
        dalle3: { status: "success", message: "¡Imagen de prueba OpenAI generada exitosamente!", url }
      }));
      setDebugLogs((prev) => [...prev, "✅ DALL-E 3 funcionando correctamente."]);
    } catch (err: any) {
      console.error(err);
      setModelTestResults((prev) => ({
        ...prev,
        dalle3: { status: "error", message: err.message }
      }));
      setDebugLogs((prev) => [...prev, `❌ Error en DALL-E 3: ${err.message}`]);
    }

    // 4. Probar Fal.ai
    if (falKeyToUse) {
      try {
        setDebugLogs((prev) => [...prev, "🔄 Probando conexión a la API de Fal.ai (Flux Schnell)..."]);
        const ok = await testFalConnection(falKeyToUse);
        if (ok) {
          setModelTestResults((prev) => ({
            ...prev,
            falInpaint: { status: "success", message: "¡Conexión y saldo de Fal.ai verificados correctamente!" }
          }));
          setDebugLogs((prev) => [...prev, "✅ API de Fal.ai (Flux) lista para usar."]);
          setDebugStatus("success");
        } else {
          throw new Error("Llamada fallida. Verifica saldo o validez de la clave.");
        }
      } catch (err: any) {
        console.error(err);
        setModelTestResults((prev) => ({
          ...prev,
          falInpaint: { status: "error", message: err.message }
        }));
        setDebugLogs((prev) => [...prev, `❌ Error en Fal.ai: ${err.message}`]);
        setDebugStatus("error");
      }
    } else {
      setDebugLogs((prev) => [...prev, "⚠️ Advertencia: Fal.ai API Key no configurada, omitiendo test de Fal.ai."]);
      setDebugStatus("success");
    }
  };

  const handleSaveDebugApiKey = (key: string, falKey: string) => {
    saveTempApiKey(key);
    saveTempFalKey(falKey);
    setDebugApiKey(key);
    setDebugFalApiKey(falKey);
    setDebugLogs((prev) => [...prev, `💾 Claves guardadas en localStorage.`]);
    runDiagnostics(key, falKey);
  };

  const handleClearDebugApiKey = () => {
    saveTempApiKey("");
    saveTempFalKey("");
    setDebugApiKey("");
    setDebugFalApiKey("");
    setAvailableModels([]);
    setDebugLogs(["🗑️ Claves temporales eliminadas. Volviendo a usar variables de entorno de .env"]);
    setDebugStatus("idle");
    setModelTestResults({
      gptMini: { status: "idle", message: "" },
      dalle3: { status: "idle", message: "" },
      falInpaint: { status: "idle", message: "" },
    });
  };



  // Dibujar el overlay de grabado vectorial sobre el render de la IA en tiempo real con canvases separados por zona
  useEffect(() => {
    if (!iaGeneratedMateUrl && !iaGeneratedVirolaUrl) return;

    const timer = setTimeout(() => {
      const canvasVirola = document.getElementById("ia-grabado-overlay-virola") as HTMLCanvasElement | null;
      const canvasFleje = document.getElementById("ia-grabado-overlay-fleje") as HTMLCanvasElement | null;

      const selectedMateConfig = MATES_REALES[selectedMateKey];
      if (!selectedMateConfig) return;

      // --- DIBUJAR GRABADO BOQUILLA (Círculo Perfecto sobre Virola Plana) ---
      if (canvasVirola) {
        const ctx = canvasVirola.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, 1024, 1024);
          if ((boquillaIncluyeTexto && textoVirola) || (boquillaIncluyeLogo && logoBoquillaUrl)) {
            const centerX = 512;
            const centerY = 512;
            const radiusX = 260;
            const radiusY = 260;

            if (boquillaIncluyeTexto && textoVirola) {
              const text = textoVirola.toUpperCase();
              const textLen = text.length;
              const angleSpacing = 0.12;
              const startAngleOffset = -((textLen - 1) * angleSpacing) / 2;
              const isRelieve = estiloTextoVirola === "bronce_relieve";

              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.font = "bold 32px sans-serif";
              ctx.fillStyle = isRelieve ? "#c59b27" : "#1c1510";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              for (let i = 0; i < textLen; i++) {
                const char = text[i];
                const angle = -Math.PI / 2 + startAngleOffset + i * angleSpacing;
                const x = radiusX * Math.cos(angle);
                const y = radiusY * Math.sin(angle);

                ctx.save();
                ctx.translate(x, y);
                const rotateAngle = Math.atan2(radiusY * Math.cos(angle), -radiusX * Math.sin(angle)) + Math.PI / 2;
                ctx.rotate(rotateAngle);
                ctx.fillText(char, 0, 0);
                ctx.restore();
              }
              ctx.restore();
            }

            if (boquillaIncluyeLogo && logoBoquillaUrl) {
              const imgLogo = new Image();
              imgLogo.crossOrigin = "anonymous";
              imgLogo.src = logoBoquillaUrl;
              imgLogo.onload = () => {
                const logoSize = 40;
                const x = centerX;
                const y = centerY - radiusY;

                ctx.save();
                ctx.translate(x, y);
                ctx.drawImage(imgLogo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
                ctx.restore();
              };
            }
          }
        }
      }

      // --- DIBUJAR GRABADO FLEJE (Elipse en perspectiva 3D sobre Mate) ---
      if (canvasFleje) {
        const ctx = canvasFleje.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, 1024, 1024);
          const flejeCenterY = selectedMateConfig.defaultFlejeCenterY;
          const flejeRadiusX = selectedMateConfig.defaultFlejeRadiusX;
          const flejeRadiusY = selectedMateConfig.defaultFlejeRadiusY;

          if (flejeCenterY !== undefined && flejeRadiusX !== undefined && flejeRadiusY !== undefined && flejeCenterY > 0) {
            if ((flejeIncluyeTexto && textoFleje) || (flejeIncluyeLogo && logoFlejeUrl)) {
              const centerX = 512;

              if (flejeIncluyeTexto && textoFleje) {
                const text = textoFleje.toUpperCase();
                const isRelieve = estiloTextoFleje === "bronce_relieve";
                const x = centerX;
                const y = flejeCenterY + flejeRadiusY;

                ctx.save();
                ctx.font = "bold 28px sans-serif";
                ctx.fillStyle = isRelieve ? "#c59b27" : "#1c1510";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(text, x, y);
                ctx.restore();
              }

              if (flejeIncluyeLogo && logoFlejeUrl) {
                const imgLogo = new Image();
                imgLogo.crossOrigin = "anonymous";
                imgLogo.src = logoFlejeUrl;
                imgLogo.onload = () => {
                  const logoSize = 65;
                  const x = centerX;
                  const y = flejeCenterY + flejeRadiusY;

                  ctx.save();
                  ctx.translate(x, y);
                  ctx.drawImage(imgLogo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
                  ctx.restore();
                };
              }
            }
          }
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [
    iaGeneratedMateUrl,
    iaGeneratedVirolaUrl,
    selectedMateKey,
    textoVirola,
    textoFleje,
    boquillaIncluyeTexto,
    boquillaIncluyeLogo,
    flejeIncluyeTexto,
    flejeIncluyeLogo,
    logoBoquillaUrl,
    logoFlejeUrl,
    estiloTextoVirola,
    estiloTextoFleje
  ]);

  const loadSingleImage = async (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // Dibuja el mate o la virola plana con grabados planos y genera su respectiva máscara de silueta en 1024x1024
  const generateCompositeAndMask = async (tipo: "mate" | "virola"): Promise<{ composite: string; mask: string }> => {
    return new Promise((resolve, reject) => {
      const selectedMateConfig = MATES_REALES[selectedMateKey];
      if (!selectedMateConfig) {
        reject(new Error("Mate base no seleccionado"));
        return;
      }

      const imgBase = new Image();
      imgBase.crossOrigin = "anonymous";
      
      // Cargar fondo según el tipo
      if (tipo === "mate") {
        imgBase.src = selectedMateConfig.src;
      } else {
        imgBase.src = selectedVirola.src; // Virola plana cenital
      }

      imgBase.onload = async () => {
        const width = 1024;
        const height = 1024;

        // Canvas 1: Composite (Imagen armada plana)
        const canvasComp = document.createElement("canvas");
        canvasComp.width = width;
        canvasComp.height = height;
        const ctxComp = canvasComp.getContext("2d");

        // Canvas 2: Mask (Máscara binaria para Inpainting)
        const canvasMask = document.createElement("canvas");
        canvasMask.width = width;
        canvasMask.height = height;
        const ctxMask = canvasMask.getContext("2d");

        if (!ctxComp || !ctxMask) {
          reject(new Error("No se pudo obtener el contexto de canvas 2D"));
          return;
        }

        // --- 1. DIBUJAR COMPOSITE BASE ---
        if (tipo === "mate") {
          ctxComp.drawImage(imgBase, 0, 0, width, height);
        } else {
          // Rellenar fondo de blanco y dibujar de forma proporcional (contain) centrado
          ctxComp.fillStyle = "#ffffff";
          ctxComp.fillRect(0, 0, width, height);
          
          const imgRatio = imgBase.width / imgBase.height;
          let drawW = width;
          let drawH = height;
          let drawX = 0;
          let drawY = 0;
          
          if (imgRatio > 1) {
            drawH = width / imgRatio;
            drawY = (height - drawH) / 2;
          } else {
            drawW = height * imgRatio;
            drawX = (width - drawW) / 2;
          }
          ctxComp.drawImage(imgBase, drawX, drawY, drawW, drawH);
        }

        // --- 2. DIBUJAR MÁSCARA BASE (Todo negro) ---
        ctxMask.fillStyle = "#000000";
        ctxMask.fillRect(0, 0, width, height);

        // --- MATE COMPLETO (Solo inpainteamos el fleje) ---
        if (tipo === "mate") {
          const necesitaFlejeInpaint = (flejeIncluyeTexto && textoFleje) || (flejeIncluyeLogo && logoFlejeUrl);
          const flejeCenterY = selectedMateConfig.defaultFlejeCenterY;
          const flejeRadiusX = selectedMateConfig.defaultFlejeRadiusX;
          const flejeRadiusY = selectedMateConfig.defaultFlejeRadiusY;

          if (necesitaFlejeInpaint && flejeCenterY !== undefined && flejeRadiusX !== undefined && flejeRadiusY !== undefined && flejeCenterY > 0) {
            const centerX = width / 2;

            if (flejeIncluyeTexto && textoFleje) {
              const text = textoFleje.toUpperCase();
              const isRelieve = estiloTextoFleje === "bronce_relieve";
              const x = centerX;
              const y = flejeCenterY + flejeRadiusY;

              // Composite
              ctxComp.save();
              ctxComp.font = "bold 28px sans-serif";
              ctxComp.fillStyle = isRelieve ? "#c59b27" : "#222222";
              ctxComp.textAlign = "center";
              ctxComp.textBaseline = "middle";

              if (isRelieve) {
                ctxComp.shadowColor = "rgba(0, 0, 0, 0.4)";
                ctxComp.shadowBlur = 3;
                ctxComp.shadowOffsetX = 1;
                ctxComp.shadowOffsetY = 1;
              }
              ctxComp.fillText(text, x, y);
              ctxComp.restore();

              // Máscara quirúrgica (trazo de 4px)
              ctxMask.save();
              ctxMask.font = "bold 28px sans-serif";
              ctxMask.fillStyle = "#ffffff";
              ctxMask.strokeStyle = "#ffffff";
              ctxMask.lineWidth = 4;
              ctxMask.textAlign = "center";
              ctxMask.textBaseline = "middle";
              ctxMask.fillText(text, x, y);
              ctxMask.strokeText(text, x, y);
              ctxMask.restore();
            }

            if (flejeIncluyeLogo && logoFlejeUrl) {
              try {
                const imgLogo = await loadSingleImage(logoFlejeUrl);
                const logoSize = 65;
                const x = centerX;
                const y = flejeCenterY + flejeRadiusY;

                // Composite
                ctxComp.save();
                ctxComp.translate(x, y);
                ctxComp.drawImage(imgLogo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
                ctxComp.restore();

                // Máscara Quirúrgica (extracción silueta con globalCompositeOperation = 'source-in' y dilatación 1px)
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = logoSize + 4;
                tempCanvas.height = logoSize + 4;
                const tempCtx = tempCanvas.getContext("2d");

                if (tempCtx) {
                  tempCtx.drawImage(imgLogo, 2, 2, logoSize, logoSize);
                  tempCtx.globalCompositeOperation = "source-in";
                  tempCtx.fillStyle = "#ffffff";
                  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                  ctxMask.save();
                  ctxMask.translate(x, y);
                  // Dilatación 1px (8 direcciones)
                  const offsets = [
                    [-1, -1], [0, -1], [1, -1],
                    [-1,  0],          [1,  0],
                    [-1,  1], [0,  1], [1,  1]
                  ];
                  offsets.forEach(([dx, dy]) => {
                    ctxMask.drawImage(tempCanvas, -tempCanvas.width / 2 + dx, -tempCanvas.height / 2 + dy);
                  });
                  ctxMask.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
                  ctxMask.restore();
                }
              } catch (err) {
                console.error("Error cargando logo en fleje para composite:", err);
              }
            }
          }
        }

        // --- VIROLA PLANA (Solo inpainteamos la boquilla en círculo perfecto) ---
        if (tipo === "virola") {
          const necesitaVirolaInpaint = (boquillaIncluyeTexto && textoVirola) || (boquillaIncluyeLogo && logoBoquillaUrl);

          if (necesitaVirolaInpaint) {
            const centerX = width / 2;
            const centerY = height / 2;
            const radiusX = 260; // Círculo perfecto de 260px de radio para la virola cenital (calza sobre el metal)
            const radiusY = 260;

            if (boquillaIncluyeTexto && textoVirola) {
              const text = textoVirola.toUpperCase();
              const textLen = text.length;
              const angleSpacing = 0.12;
              const startAngleOffset = -((textLen - 1) * angleSpacing) / 2;
              const isRelieve = estiloTextoVirola === "bronce_relieve";

              // B1. Dibujar en composite (bronce/metal con sombras)
              ctxComp.save();
              ctxComp.translate(centerX, centerY);
              ctxComp.font = "bold 32px sans-serif";
              ctxComp.fillStyle = isRelieve ? "#c59b27" : "#222222";
              ctxComp.textAlign = "center";
              ctxComp.textBaseline = "middle";

              if (isRelieve) {
                ctxComp.shadowColor = "rgba(0, 0, 0, 0.45)";
                ctxComp.shadowBlur = 3;
                ctxComp.shadowOffsetX = 1;
                ctxComp.shadowOffsetY = 1.5;
              }

              // B2. Dibujar en máscara (blanco puro con trazo quirúrgico de 4px)
              ctxMask.save();
              ctxMask.translate(centerX, centerY);
              ctxMask.font = "bold 32px sans-serif";
              ctxMask.fillStyle = "#ffffff";
              ctxMask.strokeStyle = "#ffffff";
              ctxMask.lineWidth = 4;
              ctxMask.textAlign = "center";
              ctxMask.textBaseline = "middle";

              for (let i = 0; i < textLen; i++) {
                const char = text[i];
                const angle = -Math.PI / 2 + startAngleOffset + i * angleSpacing;
                const x = radiusX * Math.cos(angle);
                const y = radiusY * Math.sin(angle);

                // Pintar en composite
                ctxComp.save();
                ctxComp.translate(x, y);
                const rotateAngle = Math.atan2(radiusY * Math.cos(angle), -radiusX * Math.sin(angle)) + Math.PI / 2;
                ctxComp.rotate(rotateAngle);
                ctxComp.fillText(char, 0, 0);
                ctxComp.restore();

                // Pintar en máscara
                ctxMask.save();
                ctxMask.translate(x, y);
                ctxMask.rotate(rotateAngle);
                ctxMask.fillText(char, 0, 0);
                ctxMask.strokeText(char, 0, 0);
                ctxMask.restore();
              }
              ctxComp.restore();
              ctxMask.restore();
            }

            if (boquillaIncluyeLogo && logoBoquillaUrl) {
              try {
                const imgLogo = await loadSingleImage(logoBoquillaUrl);
                const logoSize = 40;
                const x = centerX;
                const y = centerY - radiusY;

                // Composite
                ctxComp.save();
                ctxComp.translate(x, y);
                ctxComp.drawImage(imgLogo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
                ctxComp.restore();

                // Máscara Quirúrgica (extracción silueta con globalCompositeOperation = 'source-in' y dilatación 1px)
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = logoSize + 4;
                tempCanvas.height = logoSize + 4;
                const tempCtx = tempCanvas.getContext("2d");

                if (tempCtx) {
                  tempCtx.drawImage(imgLogo, 2, 2, logoSize, logoSize);
                  tempCtx.globalCompositeOperation = "source-in";
                  tempCtx.fillStyle = "#ffffff";
                  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                  ctxMask.save();
                  ctxMask.translate(x, y);
                  // Dilatación 1px (8 direcciones)
                  const offsets = [
                    [-1, -1], [0, -1], [1, -1],
                    [-1,  0],          [1,  0],
                    [-1,  1], [0,  1], [1,  1]
                  ];
                  offsets.forEach(([dx, dy]) => {
                    ctxMask.drawImage(tempCanvas, -tempCanvas.width / 2 + dx, -tempCanvas.height / 2 + dy);
                  });
                  ctxMask.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
                  ctxMask.restore();
                }
              } catch (err) {
                console.error("Error cargando logo en virola para composite:", err);
              }
            }
          }
        }

        // Exportar a base64
        resolve({
          composite: canvasComp.toDataURL("image/png"),
          mask: canvasMask.toDataURL("image/png")
        });
      };

      imgBase.onerror = (err) => {
        reject(err);
      };
    });
  };



  // Manejar generación con IA en dos tomas paralelas (Mate completo + Virola cenital)
  const handleIaGeneration = async () => {
    setIaGenerating(true);
    setIaStep(1);

    // Simular el procesamiento visual de pasos intermedios
    const t1 = setTimeout(() => setIaStep(2), 650);
    const t2 = setTimeout(() => setIaStep(3), 1300);
    const t3 = setTimeout(() => setIaStep(4), 1950);
    const t4 = setTimeout(() => setIaStep(5), 2600);

    const selectedMateConfig = MATES_REALES[selectedMateKey];
    const colorCuero = selectedMateConfig?.label.toLowerCase().includes("negro") ? "negro" : "moro";
    let materialBase = "leather";
    if (selectedMateConfig) {
      const labelLower = selectedMateConfig.label.toLowerCase();
      if (labelLower.includes("cerámica") || labelLower.includes("ceramica")) {
        materialBase = "smooth glazed ceramic (strictly no leather, shiny ceramic finish)";
      } else if (labelLower.includes("vidrio")) {
        materialBase = "glass";
      } else if (labelLower.includes("madera")) {
        materialBase = "polished wood";
      } else {
        materialBase = "leather";
      }
    }

    try {
      const apiKeyOpenAI = getOpenAIApiKey();
      if (!apiKeyOpenAI) {
        throw new Error("API Key de OpenAI no encontrada en VITE_OPENAI_KEY ni en localStorage.");
      }

      setIaStep(2);

      // --- TOMA 1: MATE COMPLETO (Inpainting del Fleje) ---
      const necesitaFlejeInpaint = (flejeIncluyeTexto && textoFleje) || (flejeIncluyeLogo && logoFlejeUrl);
      let matePromise: Promise<string>;
      let promptMate = "";
      let promptVirola = "";

      if (necesitaFlejeInpaint) {
        matePromise = (async () => {
          const { composite, mask } = await generateCompositeAndMask("mate");
          
          const openAiRequest: OpenAIRequest = {
            textoVirola: "", // Dejamos la virola limpia en el mate completo
            textoFleje: flejeIncluyeTexto ? textoFleje : "",
            colorCuero: colorCuero,
            tipoModelo: mateConfig.modelo,
            materialVirola: virolaMetal,
            tipoCincelado: "premium",
            logoBoquillaUrl: null,
            logoFlejeUrl: flejeIncluyeLogo ? logoFlejeUrl : null,
            estiloTextoVirola: undefined,
            estiloTextoFleje: estiloTextoFleje,
            tipoFleje: selectedFleje.label,
            fotoMateRealUrl: composite || null,
            materialCuerpo: materialBase,
            nombreMate: selectedMateConfig?.label || mateConfig.modelo
          };

          const promptUsado = await generateDynamicPromptWithVision(openAiRequest, apiKeyOpenAI);
          promptMate = promptUsado;
          console.log("Inpainting Prompt for Mate (Fleje):\n", promptUsado);

          return generateMateInpainting({
            prompt: promptUsado,
            imageUrl: composite,
            maskUrl: mask,
            strength: 0.30
          });
        })();
      } else {
        matePromise = Promise.resolve(selectedMateConfig.src);
      }

      // --- TOMA 2: VIROLA PLANA (Inpainting de la Boquilla) ---
      const necesitaVirolaInpaint = (boquillaIncluyeTexto && textoVirola) || (boquillaIncluyeLogo && logoBoquillaUrl);
      let virolaPromise: Promise<string>;

      if (necesitaVirolaInpaint) {
        virolaPromise = (async () => {
          const { composite, mask } = await generateCompositeAndMask("virola");

          const openAiRequest: OpenAIRequest = {
            textoVirola: boquillaIncluyeTexto ? textoVirola : "",
            textoFleje: "", // Solo la virola cenital aquí
            colorCuero: colorCuero,
            tipoModelo: mateConfig.modelo,
            materialVirola: virolaMetal,
            tipoCincelado: "premium",
            logoBoquillaUrl: boquillaIncluyeLogo ? logoBoquillaUrl : null,
            logoFlejeUrl: null,
            estiloTextoVirola: estiloTextoVirola,
            estiloTextoFleje: undefined,
            tipoFleje: undefined,
            fotoMateRealUrl: composite || null,
            materialCuerpo: "metal rim only",
            nombreMate: `${selectedVirola.label} cenital flat view`
          };

          const promptUsado = await generateDynamicPromptWithVision(openAiRequest, apiKeyOpenAI);
          promptVirola = promptUsado;
          console.log("Inpainting Prompt for Virola Plana:\n", promptUsado);

          return generateMateInpainting({
            prompt: promptUsado,
            imageUrl: composite,
            maskUrl: mask,
            strength: 0.30
          });
        })();
      } else {
        virolaPromise = Promise.resolve(selectedVirola.src);
      }

      setIaStep(3);
      // Ejecutar inpaintings en paralelo
      const [mateResultUrl, virolaResultUrl] = await Promise.all([matePromise, virolaPromise]);

      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      setIaStep(5);
      setIaGenerating(false);

      setIaGeneratedMateUrl(mateResultUrl);
      setIaGeneratedVirolaUrl(virolaResultUrl);

      // Guardar prompts consolidados para Debug/QA
      let promptConsolidado = "";
      if (promptMate) promptConsolidado += `[Vista General - Fleje]:\n${promptMate}\n\n`;
      if (promptVirola) promptConsolidado += `[Vista Detalle - Virola]:\n${promptVirola}`;
      setLastPromptUsed(promptConsolidado);

      confetti({
        particleCount: 100,
        spread: 70,
        colors: [BRAND.brown, BRAND.cream]
      });
    } catch (err: any) {
      console.error("Error detallado al generar con Fal Inpainting:", err);
      alert(`Error al generar con IA: ${err.message}`);
      setIaGenerating(false);
      setIaStep(0);
    }
  };



  // handleLogoUpload eliminado: ahora el upload de logo se maneja inline en el Paso 3 (Boquilla) y Paso 4 (Fleje)

  // Agregar un aplique


  const handleAddToCart = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: [BRAND.brown, BRAND.cream, BRAND.ink]
    });
    alert("Prototipo Shopify: Producto agregado al carrito.");
  };

  return (
    <div className="mate-theme min-h-screen bg-transparent text-zinc-800 font-sans antialiased overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-[rgba(251,243,222,0.92)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-5 flex justify-center">
          <div className="flex items-center gap-3">
            <img src="/logoma.jpg" alt="Matearte" className="h-12 w-12 rounded-2xl object-cover" />
            <h1 className="text-lg font-black tracking-tight text-zinc-900 sm:text-xl">Matearte</h1>
          </div>
        </div>
      </header>
      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PANEL DE SELECCIÓN Y CONTROL (Col 5) - Izquierda */}
          <div className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1">
            <div className="flex flex-col gap-3">
              
              {/* PASO 1: Material de la Virola */}
              <div className="border border-zinc-200/80 rounded-2xl bg-white overflow-hidden">
                <button 
                  onClick={() => setActiveStep(activeStep === 1 ? 0 : 1)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${activeStep === 1 ? 'bg-[#2b3e13] text-white' : 'bg-zinc-100 text-zinc-500'}`}>1</span>
                    <span className="font-bold text-xs tracking-wider uppercase text-zinc-800">Material de la Virola</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{activeStep === 1 ? '−' : '＋'}</span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${activeStep === 1 ? 'grid-rows-[1fr] opacity-100 border-t border-zinc-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <div className="p-4 space-y-4">
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Seleccioná el metal de la boca superior del mate.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setVirolaMetal("alpaca")} className={`flex flex-col rounded-xl border text-left overflow-hidden transition-all ${virolaMetal === "alpaca" ? "bg-[#2b3e13]/5 border-[#2b3e13] ring-1 ring-[#2b3e13]/25" : "bg-white border-zinc-200"}`}>
                          <img src="/assets/virola_alpaca.png" alt="Virola de Alpaca" className="w-full aspect-video object-cover border-b border-zinc-100" />
                          <div className="p-2.5">
                            <p className={`text-[11px] font-bold ${virolaMetal === "alpaca" ? "text-[#2b3e13]" : "text-zinc-800"}`}>Alpaca Plateada</p>
                            <p className="text-[8px] text-zinc-400 mt-0.5 leading-normal">Aleación de cobre, níquel y zinc. Tono plateado brillante.</p>
                          </div>
                        </button>
                        <button onClick={() => setVirolaMetal("bronce")} className={`flex flex-col rounded-xl border text-left overflow-hidden transition-all ${virolaMetal === "bronce" ? "bg-[#2b3e13]/5 border-[#2b3e13] ring-1 ring-[#2b3e13]/25" : "bg-white border-zinc-200"}`}>
                          <img src="/assets/virola_bronce.png" alt="Virola de Bronce" className="w-full aspect-video object-cover border-b border-zinc-100" />
                          <div className="p-2.5">
                            <p className={`text-[11px] font-bold ${virolaMetal === "bronce" ? "text-[#2b3e13]" : "text-zinc-800"}`}>Detalles de Bronce</p>
                            <p className="text-[8px] text-zinc-400 mt-0.5 leading-normal">Aleación dorada. Apliques en relieve sobre la virola de alpaca.</p>
                          </div>
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setActiveStep(2)} className="w-full py-2.5 bg-[#2b3e13] text-white font-bold rounded-xl text-xs hover:bg-[#4a6822] transition-all">Confirmar y Siguiente →</button>
                        <button onClick={() => setActiveStep(2)} className="w-full py-1 text-zinc-400 hover:text-zinc-600 text-[10px] font-medium text-center transition-all">Omitir este paso</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PASO 2: Selección de Mate */}
              <div className="border border-zinc-200/80 rounded-2xl bg-white overflow-hidden">
                <button 
                  onClick={() => setActiveStep(activeStep === 2 ? 0 : 2)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${activeStep === 2 ? 'bg-[#2b3e13] text-white' : 'bg-zinc-100 text-zinc-500'}`}>2</span>
                    <span className="font-bold text-xs tracking-wider uppercase text-zinc-800">Selección de Mate Real</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{activeStep === 2 ? '−' : '＋'}</span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${activeStep === 2 ? 'grid-rows-[1fr] opacity-100 border-t border-zinc-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <div className="p-4 space-y-4">
                      <div className="flex gap-1 p-1 bg-white border border-zinc-200 rounded-xl">
                        {(["imperial", "torpedo", "camionero"] as const).map((filter) => (
                          <button key={filter} onClick={() => setMateFilter(filter)} className={`flex-1 py-1.5 text-[9px] uppercase font-mono font-bold rounded-lg transition-all ${mateFilter === filter ? "bg-[#2b3e13] text-white" : "text-zinc-500 hover:text-zinc-800"}`}>{filter}</button>
                        ))}
                      </div>
                      <div className="flex flex-row gap-3 overflow-x-auto pb-3 pt-1">
                        {Object.values(MATES_REALES).filter(m => m.modelo === mateFilter).map((mate) => (
                          <button key={mate.key} onClick={() => setSelectedMateKey(mate.key)} className={`flex flex-col items-center p-2.5 rounded-xl border text-left transition-all min-w-[125px] max-w-[125px] flex-shrink-0 relative ${selectedMateKey === mate.key ? "bg-[#2b3e13]/5 border-[#2b3e13]" : "bg-white border-zinc-200/80"}`}>
                            <img src={mate.src} alt={mate.label} className="w-16 h-16 rounded-lg object-cover border border-zinc-100 mb-2" />
                            <p className={`text-[10px] font-bold leading-tight break-words w-full h-8 overflow-hidden flex items-center justify-center ${selectedMateKey === mate.key ? "text-[#2b3e13]" : "text-zinc-800"}`}>{mate.label}</p>
                            {selectedMateKey === mate.key && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#2b3e13] flex items-center justify-center text-white text-[9px] font-bold">✓</div>}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setActiveStep(3)} className="w-full py-2.5 bg-[#2b3e13] text-white font-bold rounded-xl text-xs hover:bg-[#4a6822] transition-all">Confirmar y Siguiente →</button>
                        <button onClick={() => setActiveStep(3)} className="w-full py-1 text-zinc-400 hover:text-zinc-600 text-[10px] font-medium text-center transition-all">Omitir este paso</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PASO 3: Grabado en Boquilla — con opción Texto o Escudo/Logo */}
              <div className="border border-zinc-200/80 rounded-2xl bg-white overflow-hidden">
                <button 
                  onClick={() => setActiveStep(activeStep === 3 ? 0 : 3)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${activeStep === 3 ? 'bg-[#2b3e13] text-white' : 'bg-zinc-100 text-zinc-500'}`}>3</span>
                    <span className="font-bold text-xs tracking-wider uppercase text-zinc-800">Grabado en Boquilla</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{activeStep === 3 ? '−' : '＋'}</span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${activeStep === 3 ? 'grid-rows-[1fr] opacity-100 border-t border-zinc-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    {mateConfig.modelo === "torpedo" ? (
                      <div className="p-4 space-y-3 text-center">
                        <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[280px] mx-auto">El Torpedo no posee una virola de metal ancha apta para grabados en la boquilla superior.</p>
                        <button onClick={() => setActiveStep(4)} className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all">Omitir y continuar →</button>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono block mb-1.5">Tipo de Virola</label>
                          <div className="grid grid-cols-3 gap-2">
                            {VIROLA_OPTIONS.map((virola) => (
                              <button
                                key={virola.key}
                                onClick={() => setSelectedVirolaKey(virola.key)}
                                className={`flex flex-col rounded-xl border text-left overflow-hidden transition-all ${selectedVirolaKey === virola.key ? "bg-[#2b3e13]/5 border-[#2b3e13] ring-1 ring-[#2b3e13]/25" : "bg-white border-zinc-200"}`}
                              >
                                <img src={virola.src} alt={virola.label} className="w-full aspect-video object-cover border-b border-zinc-100" />
                                <div className="p-2">
                                  <p className={`text-[9px] font-bold ${selectedVirolaKey === virola.key ? "text-[#2b3e13]" : "text-zinc-800"}`}>{virola.label}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selector Estilo de grabado */}
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono block mb-1.5">Técnica de Grabado</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setEstiloTextoVirola("bronce_relieve")} className={`flex flex-col rounded-xl border text-left overflow-hidden transition-all ${estiloTextoVirola === "bronce_relieve" ? "bg-[#2b3e13]/5 border-[#2b3e13] ring-1 ring-[#2b3e13]/25" : "bg-white border-zinc-200"}`}>
                              <img src="/assets/boquilla_bronce_relieve.jpg" alt="Bronce Soldado en Boquilla" className="w-full aspect-video object-cover border-b border-zinc-100" />
                              <div className="p-2.5">
                                <p className={`text-[10px] font-bold ${estiloTextoVirola === "bronce_relieve" ? "text-[#2b3e13]" : "text-zinc-800"}`}>Bronce Soldado</p>
                                <p className="text-[8px] text-zinc-400 mt-0.5 leading-normal">Iniciales doradas soldadas en relieve sobre la boquilla.</p>
                              </div>
                            </button>
                            <button onClick={() => setEstiloTextoVirola("laser_quemado")} className={`flex flex-col rounded-xl border text-left overflow-hidden transition-all ${estiloTextoVirola === "laser_quemado" ? "bg-[#2b3e13]/5 border-[#2b3e13] ring-1 ring-[#2b3e13]/25" : "bg-white border-zinc-200"}`}>
                              <img src="/assets/boquilla_laser_hundido.jpg" alt="Grabado Láser en Boquilla" className="w-full aspect-video object-cover border-b border-zinc-100" />
                              <div className="p-2.5">
                                <p className={`text-[10px] font-bold ${estiloTextoVirola === "laser_quemado" ? "text-[#2b3e13]" : "text-zinc-800"}`}>Grabado Láser</p>
                                <p className="text-[8px] text-zinc-400 mt-0.5 leading-normal">Grabado a fuego profundo y oscuro en bajorrelieve.</p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Toggle Texto / Escudo+Logo */}
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono block mb-1.5">Contenido en la boquilla</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setBoquillaIncluyeTexto((prev) => !prev)}
                              className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${boquillaIncluyeTexto ? "bg-[#2b3e13] border-[#2b3e13] text-white" : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800"}`}
                            >
                              Texto / Iniciales
                            </button>
                            <button
                              onClick={() => setBoquillaIncluyeLogo((prev) => !prev)}
                              className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${boquillaIncluyeLogo ? "bg-[#2b3e13] border-[#2b3e13] text-white" : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800"}`}
                            >
                              Escudo / Logo
                            </button>
                          </div>
                        </div>

                        {/* Contenido según modo */}
                        {boquillaIncluyeTexto && (
                          <div>
                            <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono block mb-1">Texto en Boquilla</label>
                            <input
                              type="text"
                              maxLength={24}
                              value={textoVirola}
                              onChange={(e) => setTextoVirola(e.target.value.slice(0, 24))}
                              placeholder="Ej: MARCOS  ELENA"
                              className="w-full bg-white border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#2b3e13] uppercase font-mono tracking-widest text-zinc-800"
                            />
                            <p className="text-[8px] text-zinc-400 mt-1">Máximo 24 caracteres. Usá espacios para centrar nombres.</p>
                          </div>
                        )}

                        {boquillaIncluyeLogo && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-zinc-200 hover:border-[#2b3e13]/40 hover:bg-[#2b3e13]/5 cursor-pointer text-xs font-semibold transition-all text-zinc-700">
                                <Upload className="w-4 h-4 text-[#2b3e13]" />
                                <span>{logoBoquillaUrl ? "Cambiar imagen" : "Subir escudo o logo (PNG/SVG/JPG)"}</span>
                                <input type="file" accept="image/*" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setLogoBoquillaUrl(ev.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }} className="hidden" />
                              </label>
                              {logoBoquillaUrl && (
                                <button onClick={() => setLogoBoquillaUrl(null)} className="py-3 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs transition-colors">Quitar</button>
                              )}
                            </div>
                            {logoBoquillaUrl && (
                              <div className="flex justify-center p-2 border border-zinc-150 rounded-xl bg-zinc-50/50">
                                <img src={logoBoquillaUrl} alt="Logo cargado" className="h-20 rounded-lg object-contain border border-zinc-200 bg-white p-1" />
                              </div>
                            )}
                            <p className="text-[8px] text-zinc-400 leading-relaxed">Aceptamos JPG, PNG y SVG. Para mayor calidad en el grabado láser, preferí imágenes en alta resolución o vectores.</p>
                          </div>
                        )}

                        {!boquillaIncluyeTexto && !boquillaIncluyeLogo && (
                          <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center text-[10px] text-zinc-500">
                            No se agregará texto ni logo en la boquilla.
                          </p>
                        )}

                        <div className="flex flex-col gap-2">
                          <button onClick={() => setActiveStep(4)} className="w-full py-2.5 bg-[#2b3e13] text-white font-bold rounded-xl text-xs hover:bg-[#4a6822] transition-all">Confirmar y Siguiente →</button>
                          <button onClick={() => { setTextoVirola(""); setLogoBoquillaUrl(null); setBoquillaIncluyeTexto(false); setBoquillaIncluyeLogo(false); setActiveStep(4); }} className="w-full py-1 text-zinc-400 hover:text-zinc-600 text-[10px] font-medium text-center transition-all">Omitir este paso (Sin Grabado en Boquilla)</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PASO 4: Grabado en Fleje — con opción Texto o Escudo/Logo */}
              <div className="border border-zinc-200/80 rounded-2xl bg-white overflow-hidden">
                <button 
                  onClick={() => setActiveStep(activeStep === 4 ? 0 : 4)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${activeStep === 4 ? 'bg-[#2b3e13] text-white' : 'bg-zinc-100 text-zinc-500'}`}>4</span>
                    <span className="font-bold text-xs tracking-wider uppercase text-zinc-800">Grabado en Fleje</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{activeStep === 4 ? '−' : '＋'}</span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${activeStep === 4 ? 'grid-rows-[1fr] opacity-100 border-t border-zinc-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    {false ? (
                      <div className="p-4 space-y-3 text-center">
                        <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[280px] mx-auto">El fleje metálico es un detalle exclusivo de los mates <strong>Imperiales</strong> y <strong>Torpedos</strong> premium. Tu {mateConfig.label} no lleva fleje en la cintura.</p>
                        <button onClick={() => setActiveStep(5)} className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all">Omitir y continuar →</button>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {/* Selector tipo de fleje */}
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono block mb-1.5">Tipo de Fleje</label>
                          <div className="grid grid-cols-5 gap-2">
                            {FLEJE_OPTIONS.map((fleje) => (
                              <button
                                key={fleje.key}
                                onClick={() => setSelectedFlejeKey(fleje.key)}
                                className={`flex flex-col rounded-xl border text-left overflow-hidden transition-all ${selectedFlejeKey === fleje.key ? "bg-[#2b3e13]/5 border-[#2b3e13] ring-1 ring-[#2b3e13]/25" : "bg-white border-zinc-200"}`}
                              >
                                <img src={fleje.src} alt={fleje.label} className="w-full aspect-video object-cover border-b border-zinc-100" />
                                <div className="p-1.5 text-center">
                                  <p className={`text-[8px] font-bold leading-none ${selectedFlejeKey === fleje.key ? "text-[#2b3e13]" : "text-zinc-800"}`}>{fleje.label}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selector técnica de grabado en fleje */}
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono block mb-1.5">Técnica de Grabado en Fleje</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setEstiloTextoFleje("bronce_relieve")} className={`flex flex-col rounded-xl border text-left overflow-hidden transition-all ${estiloTextoFleje === "bronce_relieve" ? "bg-[#2b3e13]/5 border-[#2b3e13] ring-1 ring-[#2b3e13]/25" : "bg-white border-zinc-200"}`}>
                              <img src="/assets/estilo_bronce_relieve.png" alt="Bronce Soldado" className="w-full aspect-video object-cover border-b border-zinc-100" />
                              <div className="p-2.5">
                                <p className={`text-[10px] font-bold ${estiloTextoFleje === "bronce_relieve" ? "text-[#2b3e13]" : "text-zinc-800"}`}>Bronce Soldado</p>
                                <p className="text-[8px] text-zinc-400 mt-0.5 leading-normal">Iniciales de bronce doradas en relieve de 1.5mm.</p>
                              </div>
                            </button>
                            <button onClick={() => setEstiloTextoFleje("laser_quemado")} className={`flex flex-col rounded-xl border text-left overflow-hidden transition-all ${estiloTextoFleje === "laser_quemado" ? "bg-[#2b3e13]/5 border-[#2b3e13] ring-1 ring-[#2b3e13]/25" : "bg-white border-zinc-200"}`}>
                              <img src="/assets/estilo_laser_hundido.png" alt="Grabado Láser" className="w-full aspect-video object-cover border-b border-zinc-100" />
                              <div className="p-2.5">
                                <p className={`text-[10px] font-bold ${estiloTextoFleje === "laser_quemado" ? "text-[#2b3e13]" : "text-zinc-800"}`}>Grabado Láser</p>
                                <p className="text-[8px] text-zinc-400 mt-0.5 leading-normal">Grabado a fuego profundo y oscuro (hundido) en el metal.</p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Toggle Texto / Escudo+Logo */}
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono block mb-1.5">Contenido en el fleje</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setFlejeIncluyeTexto((prev) => !prev)}
                              className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${flejeIncluyeTexto ? "bg-[#2b3e13] border-[#2b3e13] text-white" : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800"}`}
                            >
                              Texto / Iniciales
                            </button>
                            <button
                              onClick={() => setFlejeIncluyeLogo((prev) => !prev)}
                              className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${flejeIncluyeLogo ? "bg-[#2b3e13] border-[#2b3e13] text-white" : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800"}`}
                            >
                              Escudo / Logo
                            </button>
                          </div>
                        </div>

                        {/* Contenido según modo */}
                        {flejeIncluyeTexto && (
                          <div>
                            <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono block mb-1">Texto en Fleje (Medio)</label>
                            <input
                              type="text"
                              maxLength={15}
                              value={textoFleje}
                              onChange={(e) => setTextoFleje(e.target.value.slice(0, 15))}
                              placeholder="Ej: 323"
                              className="w-full bg-white border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#2b3e13] uppercase font-mono tracking-widest text-zinc-800"
                            />
                          </div>
                        )}

                        {flejeIncluyeLogo && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-zinc-200 hover:border-[#2b3e13]/40 hover:bg-[#2b3e13]/5 cursor-pointer text-xs font-semibold transition-all text-zinc-700">
                                <Upload className="w-4 h-4 text-[#2b3e13]" />
                                <span>{logoFlejeUrl ? "Cambiar imagen" : "Subir escudo o logo (PNG/SVG/JPG)"}</span>
                                <input type="file" accept="image/*" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => setLogoFlejeUrl(ev.target?.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }} className="hidden" />
                              </label>
                              {logoFlejeUrl && (
                                <button onClick={() => setLogoFlejeUrl(null)} className="py-3 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs transition-colors">Quitar</button>
                              )}
                            </div>
                            {logoFlejeUrl && (
                              <div className="flex justify-center p-2 border border-zinc-150 rounded-xl bg-zinc-50/50">
                                <img src={logoFlejeUrl} alt="Logo fleje" className="h-20 rounded-lg object-contain border border-zinc-200 bg-white p-1" />
                              </div>
                            )}
                            <p className="text-[8px] text-zinc-400 leading-relaxed">Aceptamos JPG, PNG y SVG. Para mayor calidad en el grabado, preferí imágenes en alta resolución o vectores.</p>
                          </div>
                        )}

                        {!flejeIncluyeTexto && !flejeIncluyeLogo && (
                          <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center text-[10px] text-zinc-500">
                            No se agregará texto ni logo en el fleje.
                          </p>
                        )}

                        <div className="flex flex-col gap-2">
                          <button onClick={() => setActiveStep(5)} className="w-full py-2.5 bg-[#2b3e13] text-white font-bold rounded-xl text-xs hover:bg-[#4a6822] transition-all">Confirmar y Siguiente →</button>
                          <button onClick={() => { setTextoFleje(""); setLogoFlejeUrl(null); setFlejeIncluyeTexto(false); setFlejeIncluyeLogo(false); setActiveStep(5); }} className="w-full py-1 text-zinc-400 hover:text-zinc-600 text-[10px] font-medium text-center transition-all">Omitir este paso (Sin Grabado en Fleje)</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PASO 5: Render IA */}
              <div className="border border-[#2b3e13]/30 rounded-2xl bg-white overflow-hidden">
                <button 
                  onClick={() => setActiveStep(activeStep === 5 ? 0 : 5)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2b3e13]/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${activeStep === 5 ? 'bg-[#2b3e13] text-white' : 'bg-zinc-100 text-zinc-500'}`}>5</span>
                    <span className="font-bold text-xs tracking-wider uppercase text-[#2b3e13] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Renderizado Fotorrealista IA
                    </span>
                  </div>
                  <span className="text-[10px] text-[#2b3e13]/60">{activeStep === 5 ? '−' : '＋'}</span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${activeStep === 5 ? 'grid-rows-[1fr] opacity-100 border-t border-[#2b3e13]/10' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <div className="p-4 space-y-4">
                      <div className="bg-[#2b3e13]/5 border border-[#2b3e13]/15 p-3 rounded-xl text-[#2b3e13] text-[10px] leading-relaxed">
                        Enviamos tu diseño al generador de IA para ver cómo quedaría el mate con las letras y logos fundidos fotorrealistamente sobre el metal real.
                        <br /><span className="opacity-60 text-[8px] mt-1 block">* El resultado es una simulación visual. La realidad del artesano puede variar levemente.</span>
                      </div>

                      {!iaGenerating && !iaGeneratedMateUrl && !iaGeneratedVirolaUrl && (
                        <button onClick={handleIaGeneration} className="w-full py-3 bg-[#2b3e13] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#4a6822] active:scale-[0.98] transition-all text-xs">
                          ⚡ Generar Propuesta con IA
                        </button>
                      )}

                      {iaGenerating && (
                        <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-3 font-mono text-[10px] text-zinc-700">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[#2b3e13]">
                            <span>Procesando Renders con IA...</span>
                            <span className="animate-pulse">●</span>
                          </div>
                          <div className="space-y-1">
                            <p className={iaStep >= 1 ? "text-[#2b3e13]" : "text-zinc-400"}>{iaStep >= 1 ? "✓" : "○"} [IA] Cargando modelo inpainting...</p>
                            <p className={iaStep >= 2 ? "text-[#2b3e13]" : "text-zinc-400"}>{iaStep >= 2 ? "✓" : "○"} [IA] Detectando contornos en virola...</p>
                            <p className={iaStep >= 3 ? "text-[#2b3e13]" : "text-zinc-400"}>{iaStep >= 3 ? "✓" : "○"} [IA] Modelando grabado en 3D...</p>
                            {(logoBoquillaUrl || logoFlejeUrl) && <p className={iaStep >= 4 ? "text-[#2b3e13]" : "text-zinc-400"}>{iaStep >= 4 ? "✓" : "○"} [IA] Integrando escudo/logo...</p>}
                            <p className={iaStep >= 5 ? "text-[#2b3e13]" : "text-zinc-400"}>{iaStep >= 5 ? "✓" : "○"} [IA] Calculando sombras y reflejos...</p>
                          </div>
                          <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                            <div className="bg-[#2b3e13] h-full transition-all duration-500" style={{ width: `${(iaStep / 5) * 100}%` }} />
                          </div>
                        </div>
                      )}
                      {(iaGeneratedMateUrl || iaGeneratedVirolaUrl) && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-white border border-zinc-200 p-3.5 rounded-2xl">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-zinc-800 font-bold text-[11px] uppercase tracking-wide">Propuestas Listas (2 Fotos)</span>
                            </div>
                            <button onClick={() => { setIaGeneratedMateUrl(null); setIaGeneratedVirolaUrl(null); }} className="text-zinc-500 hover:text-zinc-800 underline text-[9px] font-bold">Generar de nuevo</button>
                          </div>

                          {/* Visualizador de Prompt de la IA (QA) */}
                          {lastPromptUsed && (
                            <div className="bg-[#fbf3de] border border-[#7a4a31]/25 p-3.5 rounded-2xl text-[9px] font-mono text-zinc-700 leading-normal space-y-1.5 shadow-sm">
                              <div className="flex items-center gap-1.5 text-[#7a4a31] font-bold uppercase tracking-wider text-[10px]">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                <span>Prompt de la IA (Fidelidad de Diseño)</span>
                              </div>
                              <p className="whitespace-pre-wrap select-all bg-white/50 p-2 rounded-lg border border-zinc-200/50">{lastPromptUsed}</p>
                              <p className="text-[8px] text-[#7a4a31]/60 italic font-sans">* Esta es la descripción exacta redactada por el orquestador Vision tras analizar tus fotos y variables.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* CTA PRINCIPAL */}
            <div className="mt-2 border-t border-zinc-100 pt-4">
              <button onClick={handleAddToCart} className="w-full bg-[#2b3e13] hover:bg-[#4a6822] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-sm tracking-wide">
                ✓ Listo — Guardar Personalización
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: Visualizador de Render IA o Lista de Personalización */}
          <div className="lg:col-span-7 flex flex-col items-center order-1 lg:order-2 w-full">
            {(iaGeneratedMateUrl || iaGeneratedVirolaUrl) ? (
              /* Visualizador de Renders IA Doble (Mate Completo arriba + Virola Cenital abajo) */
              <div className="w-full max-w-[550px] flex flex-col gap-6 items-center">
                
                {/* 1. VISTA MATE COMPLETO (FLEJE) */}
                <div className="relative w-full aspect-square rounded-3xl bg-white border border-zinc-200/80 overflow-hidden shadow-sm flex items-center justify-center transition-all duration-300">
                  <img src={iaGeneratedMateUrl || mateConfig.src} alt="Propuesta IA - Mate Completo" className="w-full h-full object-cover" />

                  {/* Canvas de previsualización interactiva del fleje */}
                  <canvas 
                    id="ia-grabado-overlay-fleje" 
                    width={1024} 
                    height={1024} 
                    className="absolute inset-0 w-full h-full pointer-events-none" 
                    style={{ 
                      filter: estiloTextoFleje === 'bronce_relieve' ? 'url(#bronce-relieve-filter)' : 'url(#laser-quemado-filter)',
                      mixBlendMode: estiloTextoFleje === 'bronce_relieve' ? 'normal' : 'multiply',
                      opacity: estiloTextoFleje === 'bronce_relieve' ? 1.0 : 0.85
                    }} 
                  />

                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-[#2b3e13]/30 flex items-center gap-1.5 text-[9px] text-[#fbf3de] font-mono z-20 font-bold uppercase tracking-wider">
                    <span>1. Vista Mate Completo</span>
                  </div>
                </div>

                {/* 2. VISTA DETALLE VIROLA (CENITAL CIRCULAR) */}
                <div className="relative w-full aspect-square rounded-3xl bg-white border border-zinc-200/80 overflow-hidden shadow-sm flex items-center justify-center transition-all duration-300">
                  <img src={iaGeneratedVirolaUrl || selectedVirola.src} alt="Propuesta IA - Detalle Virola Plana" className="w-full h-full object-cover" />

                  {/* Canvas de previsualización interactiva de la virola */}
                  <canvas 
                    id="ia-grabado-overlay-virola" 
                    width={1024} 
                    height={1024} 
                    className="absolute inset-0 w-full h-full pointer-events-none" 
                    style={{ 
                      filter: estiloTextoVirola === 'bronce_relieve' ? 'url(#bronce-relieve-filter)' : 'url(#laser-quemado-filter)',
                      mixBlendMode: estiloTextoVirola === 'bronce_relieve' ? 'normal' : 'multiply',
                      opacity: estiloTextoVirola === 'bronce_relieve' ? 1.0 : 0.85
                    }} 
                  />

                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-[#2b3e13]/30 flex items-center gap-1.5 text-[9px] text-[#fbf3de] font-mono z-20 font-bold uppercase tracking-wider">
                    <span>2. Detalle Virola Plana</span>
                  </div>
                </div>

                {/* Caja de control del visor */}
                <div className="flex w-full justify-between items-center bg-black/75 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 mt-1 shadow-md">
                  <div className="flex items-center gap-2 text-[10px] text-[#fbf3de] font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-[#f3e1b9] animate-pulse" />
                    <span>Visualización Doble Activa</span>
                  </div>
                  <button 
                    onClick={() => { 
                      setIaGeneratedMateUrl(null); 
                      setIaGeneratedVirolaUrl(null); 
                    }} 
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 text-[10px] text-white font-bold transition-all"
                  >
                    Volver al Resumen de Pasos
                  </button>
                </div>
              </div>
            ) : (
              /* Lista de Pasos Personalizados (Ficha de Configuración Visual en lista) */
              <div className="w-full max-w-[550px] bg-[#f6f6f6]/50 border border-zinc-200/80 rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-[#2b3e13] font-mono">Ficha de Armado</h3>
                  <span className="text-[9px] bg-[#2b3e13] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Tu Configuración</span>
                </div>

                <div className="space-y-4">
                  {/* Paso 1: Material de la Virola */}
                  <div className="flex items-center justify-between bg-white border border-zinc-200/60 p-4 rounded-2xl shadow-sm">
                    <div className="flex-1 pr-4">
                      <p className="text-[9px] text-zinc-400 uppercase font-mono tracking-widest font-bold">Paso 1 — Virola</p>
                      <h4 className="text-sm font-bold text-zinc-800 mt-1 uppercase">
                        {virolaMetal === "alpaca" ? "Alpaca Plateada" : "Detalles de Bronce"}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                        {virolaMetal === "alpaca" 
                          ? "Virola de metal blanco tradicional de alta durabilidad." 
                          : "Detalles dorados de bronce soldados a mano."}
                      </p>
                    </div>
                    <img 
                      src={virolaMetal === "alpaca" ? "/assets/virola_alpaca.png" : "/assets/virola_bronce.png"} 
                      alt="Virola" 
                      className="w-20 h-20 rounded-xl object-cover border border-zinc-100 flex-shrink-0" 
                    />
                  </div>

                  {/* Paso 2: Modelo de Mate */}
                  <div className="flex items-center justify-between bg-white border border-zinc-200/60 p-4 rounded-2xl shadow-sm">
                    <div className="flex-1 pr-4">
                      <p className="text-[9px] text-zinc-400 uppercase font-mono tracking-widest font-bold">Paso 2 — Mate Base</p>
                      <h4 className="text-sm font-bold text-zinc-800 mt-1 uppercase">{mateConfig.label}</h4>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                        Mate artesanal forrado en cuero legítimo.
                      </p>
                    </div>
                    <img 
                      src={mateConfig.src} 
                      alt={mateConfig.label} 
                      className="w-20 h-20 rounded-xl object-cover border border-zinc-100 flex-shrink-0" 
                    />
                  </div>

                  {/* Paso 3: Grabado en Boquilla */}
                  {mateConfig.modelo !== "torpedo" ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-zinc-200/60 p-4 rounded-2xl shadow-sm gap-4">
                      <div className="flex-1">
                        <p className="text-[9px] text-zinc-400 uppercase font-mono tracking-widest font-bold">Paso 3 — Boquilla</p>
                        <h4 className="text-sm font-bold text-zinc-800 mt-1 uppercase">
                          {selectedVirola.label}
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="text-[10px] text-zinc-700 font-mono tracking-wider bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-150 inline-block font-semibold">
                            {estiloTextoVirola === "bronce_relieve" ? "Bronce Soldado" : "Grabado Láser"}
                          </span>
                          {boquillaIncluyeTexto && textoVirola && (
                            <span className="text-[10px] text-[#7a4a31] font-mono tracking-wider bg-[#fbf3de] px-2.5 py-1 rounded-lg border border-[#7a4a31]/20 inline-block font-bold">
                              "{textoVirola}"
                            </span>
                          )}

                          {!boquillaIncluyeTexto && !boquillaIncluyeLogo && (
                            <span className="text-[10px] text-zinc-700 font-mono tracking-wider bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-150 inline-block font-semibold">
                              Sin grabado
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Miniaturas Visuales */}
                      <div className="flex gap-3 flex-shrink-0 items-center bg-zinc-50/50 p-2 rounded-xl border border-zinc-100">
                        {/* Virola */}
                        <div className="flex flex-col items-center gap-1">
                          <img 
                            src={selectedVirola.src} 
                            alt={selectedVirola.label} 
                            className="w-14 h-14 rounded-lg object-cover border border-zinc-200/80 bg-white shadow-xs" 
                          />
                          <span className="text-[7px] text-zinc-400 font-mono uppercase tracking-wider font-bold">Virola</span>
                        </div>
                        {/* Grabado */}
                        <div className="flex flex-col items-center gap-1">
                          <img 
                            src={estiloTextoVirola === "bronce_relieve" ? "/assets/boquilla_bronce_relieve.jpg" : "/assets/boquilla_laser_hundido.jpg"} 
                            alt={estiloTextoVirola === "bronce_relieve" ? "Bronce Soldado" : "Grabado Láser"} 
                            className="w-14 h-14 rounded-lg object-cover border border-zinc-200/80 bg-white shadow-xs" 
                          />
                          <span className="text-[7px] text-zinc-400 font-mono uppercase tracking-wider font-bold">Grabado</span>
                        </div>
                        {/* Logo */}
                        {boquillaIncluyeLogo && logoBoquillaUrl && (
                          <div className="flex flex-col items-center gap-1">
                            <img 
                              src={logoBoquillaUrl} 
                              alt="Logo" 
                              className="w-14 h-14 rounded-lg object-contain border border-zinc-200/80 bg-white p-1 shadow-xs" 
                            />
                            <span className="text-[7px] text-zinc-400 font-mono uppercase tracking-wider font-bold">Logo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
 
                  {/* Paso 4: Grabado en Fleje */}
                  {mateConfig.modelo === "imperial" || mateConfig.modelo === "torpedo" ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-zinc-200/60 p-4 rounded-2xl shadow-sm gap-4">
                      <div className="flex-1">
                        <p className="text-[9px] text-zinc-400 uppercase font-mono tracking-widest font-bold">Paso 4 — Fleje</p>
                        <h4 className="text-sm font-bold text-zinc-800 mt-1 uppercase">
                          {selectedFleje.label}
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="text-[10px] text-zinc-700 font-mono tracking-wider bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-150 inline-block font-semibold">
                            {estiloTextoFleje === "bronce_relieve" ? "Bronce Soldado" : "Grabado Láser"}
                          </span>
                          {flejeIncluyeTexto && textoFleje && (
                            <span className="text-[10px] text-[#7a4a31] font-mono tracking-wider bg-[#fbf3de] px-2.5 py-1 rounded-lg border border-[#7a4a31]/20 inline-block font-bold">
                              "{textoFleje}"
                            </span>
                          )}
                          {!flejeIncluyeTexto && !flejeIncluyeLogo && (
                            <span className="text-[10px] text-zinc-700 font-mono tracking-wider bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-150 inline-block font-semibold">
                              Sin grabado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Miniaturas Visuales */}
                      <div className="flex gap-3 flex-shrink-0 items-center bg-zinc-50/50 p-2 rounded-xl border border-zinc-100">
                        {/* Fleje */}
                        <div className="flex flex-col items-center gap-1">
                          <img 
                            src={selectedFleje.src} 
                            alt={selectedFleje.label} 
                            className="w-14 h-14 rounded-lg object-cover border border-zinc-200/80 bg-white shadow-xs" 
                          />
                          <span className="text-[7px] text-zinc-400 font-mono uppercase tracking-wider font-bold">Fleje</span>
                        </div>
                        {/* Grabado */}
                        <div className="flex flex-col items-center gap-1">
                          <img 
                            src={estiloTextoFleje === "bronce_relieve" ? "/assets/estilo_bronce_relieve.png" : "/assets/estilo_laser_hundido.png"} 
                            alt={estiloTextoFleje === "bronce_relieve" ? "Bronce Soldado" : "Grabado Láser"} 
                            className="w-14 h-14 rounded-lg object-cover border border-zinc-200/80 bg-white shadow-xs" 
                          />
                          <span className="text-[7px] text-zinc-400 font-mono uppercase tracking-wider font-bold">Grabado</span>
                        </div>
                        {/* Logo */}
                        {flejeIncluyeLogo && logoFlejeUrl && (
                          <div className="flex flex-col items-center gap-1">
                            <img 
                              src={logoFlejeUrl} 
                              alt="Logo Fleje" 
                              className="w-14 h-14 rounded-lg object-contain border border-zinc-200/80 bg-white p-1 shadow-xs" 
                            />
                            <span className="text-[7px] text-zinc-400 font-mono uppercase tracking-wider font-bold">Logo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Botón Flotante para Diagnóstico de API Key */}
      <button 
        onClick={() => {
          setShowDebugModal(true);
          const currentKey = getOpenAIApiKey();
          if (currentKey) {
            setDebugApiKey(currentKey);
            runDiagnostics(currentKey);
          }
        }}
        className="fixed bottom-6 right-6 bg-zinc-900 hover:bg-zinc-800 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 z-40 flex items-center gap-2 text-xs font-mono font-bold border border-zinc-700 active:scale-95"
      >
        <Wrench className="w-4 h-4 text-[#fbf3de] animate-pulse" />
        <span>Diagnóstico API</span>
      </button>

      {/* MODAL DE DIAGNÓSTICO */}
      {showDebugModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-zinc-950 text-[#fbf3de] p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-[#f3e1b9]" />
                <div>
                  <h3 className="font-bold text-sm tracking-wider uppercase font-mono">Consola de Autodiagnóstico API</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Depuración e inspección de permisos de OpenAI</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDebugModal(false)}
                className="text-zinc-400 hover:text-[#fbf3de] font-bold font-mono text-xs p-1"
              >
                [X] CERRAR
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-zinc-800 text-xs">
              
              {/* Sección API Key */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-widest font-mono text-zinc-500">Claves de Acceso (API Keys)</span>
                  <span className="text-[9px] text-zinc-400 font-mono">Prioriza localStorage sobre .env</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">OpenAI API Key (Vision/Prompt)</label>
                    <input
                      type="password"
                      placeholder={debugApiKey ? "••••••••••••••••••••••••" : "sk-proj-..."}
                      value={debugApiKey}
                      onChange={(e) => setDebugApiKey(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#2b3e13]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Fal.ai API Key (Flux Inpainting)</label>
                    <input
                      type="password"
                      placeholder={debugFalApiKey ? "••••••••••••••••••••••••" : "Pega tu fal_key_..."}
                      value={debugFalApiKey}
                      onChange={(e) => setDebugFalApiKey(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#2b3e13]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button 
                    onClick={() => handleSaveDebugApiKey(debugApiKey, debugFalApiKey)}
                    className="bg-[#2b3e13] hover:bg-[#4a6822] text-white px-4 py-2 rounded-xl font-bold font-mono transition-all text-[11px]"
                  >
                    Guardar y Testear
                  </button>
                  {(localStorage.getItem("TEMP_OPENAI_KEY") || localStorage.getItem("TEMP_FAL_KEY")) && (
                    <button 
                      onClick={handleClearDebugApiKey}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-xl font-bold font-mono transition-all text-[11px]"
                    >
                      Limpiar Temporales
                    </button>
                  )}
                </div>
                <p className="text-[8px] text-zinc-400 leading-normal">
                  Las API Keys guardadas aquí se almacenan localmente en tu navegador. Si no ingresas nada, el sistema utiliza 
                  las claves definidas en tu archivo de entorno <code>.env</code> (<code>VITE_OPENAI_KEY</code> y <code>VITE_FAL_KEY</code>).
                </p>
              </div>

              {/* Resultados rápidos de los tests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Test 1: GPT-4o-mini */}
                <div className="border border-zinc-200 rounded-2xl p-3 bg-zinc-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[9px] uppercase tracking-wider font-mono text-zinc-600">Prueba GPT-4o-Mini</span>
                    {modelTestResults.gptMini.status === "success" && <span className="text-emerald-600 font-bold font-mono text-[9px]">OK</span>}
                    {modelTestResults.gptMini.status === "error" && <span className="text-red-600 font-bold font-mono text-[9px]">FALLO</span>}
                    {modelTestResults.gptMini.status === "idle" && <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-tight">
                    Prueba chat completion de OpenAI.
                  </p>
                  {modelTestResults.gptMini.status !== "idle" && (
                    <div className={`p-2 rounded-lg border text-[8px] font-mono break-words ${
                      modelTestResults.gptMini.status === "success" ? "bg-emerald-50/50 border-emerald-150 text-emerald-800" : "bg-red-50/50 border-red-150 text-red-800"
                    }`}>
                      {modelTestResults.gptMini.message}
                    </div>
                  )}
                </div>

                {/* Test 2: DALL-E 3 */}
                <div className="border border-zinc-200 rounded-2xl p-3 bg-zinc-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[9px] uppercase tracking-wider font-mono text-zinc-600">Prueba DALL-E 3</span>
                    {modelTestResults.dalle3.status === "success" && <span className="text-emerald-600 font-bold font-mono text-[9px]">OK</span>}
                    {modelTestResults.dalle3.status === "error" && <span className="text-red-600 font-bold font-mono text-[9px]">FALLO</span>}
                    {modelTestResults.dalle3.status === "idle" && <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-tight">
                    Valida habilitación de DALL-E 3 en OpenAI.
                  </p>
                  {modelTestResults.dalle3.status !== "idle" && (
                    <div className={`p-2 rounded-lg border text-[8px] font-mono break-words ${
                      modelTestResults.dalle3.status === "success" ? "bg-emerald-50/50 border-emerald-150 text-emerald-800" : "bg-red-50/50 border-red-150 text-red-800"
                    }`}>
                      {modelTestResults.dalle3.message}
                      {modelTestResults.dalle3.url && (
                        <a href={modelTestResults.dalle3.url} target="_blank" rel="noreferrer" className="block text-blue-600 underline mt-1.5 font-bold">
                          [Ver Imagen]
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Test 3: Fal.ai (Flux) */}
                <div className="border border-zinc-200 rounded-2xl p-3 bg-zinc-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[9px] uppercase tracking-wider font-mono text-zinc-600">Prueba Fal.ai (Flux)</span>
                    {modelTestResults.falInpaint.status === "success" && <span className="text-emerald-600 font-bold font-mono text-[9px]">OK</span>}
                    {modelTestResults.falInpaint.status === "error" && <span className="text-red-600 font-bold font-mono text-[9px]">FALLO</span>}
                    {modelTestResults.falInpaint.status === "idle" && <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-tight">
                    Valida saldo y conexión del motor Flux.
                  </p>
                  {modelTestResults.falInpaint.status !== "idle" && (
                    <div className={`p-2 rounded-lg border text-[8px] font-mono break-words ${
                      modelTestResults.falInpaint.status === "success" ? "bg-emerald-50/50 border-emerald-150 text-emerald-800" : "bg-red-50/50 border-red-150 text-red-800"
                    }`}>
                      {modelTestResults.falInpaint.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Registro de Consola / Log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-widest font-mono text-zinc-500">Registro de Eventos / Logs</span>
                  <button 
                    onClick={() => runDiagnostics(debugApiKey, debugFalApiKey)} 
                    disabled={debugStatus === "running"}
                    className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 transition-colors py-1 px-2 border border-zinc-200 rounded-lg bg-white shadow-xs font-mono text-[9px]"
                  >
                    <RefreshCw className={`w-3 h-3 ${debugStatus === "running" ? "animate-spin" : ""}`} />
                    Ejecutar Diagnóstico
                  </button>
                </div>
                <div className="bg-zinc-950 text-zinc-200 p-4 rounded-2xl font-mono text-[10px] space-y-1.5 overflow-y-auto max-h-[160px] border border-zinc-800 shadow-inner">
                  {debugLogs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap leading-relaxed">{log}</div>
                  ))}
                  {debugLogs.length === 0 && <span className="text-zinc-500 italic">Presiona "Ejecutar Diagnóstico" para comenzar.</span>}
                </div>
              </div>

              {/* Modelos Disponibles */}
              {availableModels.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-[10px] uppercase tracking-widest font-mono text-zinc-500">Modelos autorizados para esta clave ({availableModels.length})</span>
                  <div className="flex flex-wrap gap-1 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl max-h-[120px] overflow-y-auto">
                    {availableModels.map((m) => {
                      const isTarget = m === "dall-e-3" || m === "gpt-4o-mini";
                      return (
                        <span 
                          key={m} 
                          className={`px-2 py-1 rounded text-[9px] font-mono ${
                            isTarget 
                              ? "bg-[#2b3e13]/10 text-[#2b3e13] font-bold border border-[#2b3e13]/25" 
                              : "bg-white text-zinc-500 border border-zinc-150"
                          }`}
                        >
                          {m}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Caja de Ayuda y Diagnóstico Manual */}
              <div className="bg-[#fbf3de] border border-[#7a4a31]/20 p-4 rounded-2xl text-zinc-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[#7a4a31]">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <h4 className="font-bold text-[11px] uppercase tracking-wide">¿Por qué puede fallar DALL-E 3?</h4>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-[10px] pl-1 leading-relaxed text-zinc-700">
                  <li>
                    <strong className="text-zinc-900">Nivel de Facturación (Tier 1 requerido):</strong> OpenAI restringe DALL-E 3 a cuentas de <strong className="text-zinc-900">Tier 1 o superior</strong>. Tu cuenta es Tier 0 (Free) hasta que hayas cargado un mínimo de <strong className="text-zinc-900">$5.00 USD netos</strong> y se haya procesado con éxito.
                  </li>
                  <li>
                    <strong className="text-zinc-900">Propagación de Saldo (Demora de 15 min):</strong> Tras cargar saldo en la plataforma de OpenAI, puede tardar hasta 15-30 minutos en actualizarse el Tier en sus APIs.
                  </li>
                  <li>
                    <strong className="text-zinc-900">Límites de Proyecto (Restricción de Modelos):</strong> Si estás utilizando una API Key de Proyecto (en lugar de una Key de Usuario clásica), verifica que el modelo <code className="bg-white/80 px-1 rounded">dall-e-3</code> esté habilitado en <strong>Settings &gt; Projects &gt; [Tu Proyecto] &gt; Limits &gt; Model Usage</strong> en el panel de OpenAI.
                  </li>
                  <li>
                    <strong className="text-zinc-900">API Key sin permisos de Organización:</strong> Si estás en múltiples organizaciones, la clave puede estar apuntando a una organización sin saldo. Configura la cabecera u organiza tus claves.
                  </li>
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-zinc-50 border-t border-zinc-100 p-4 flex justify-end">
              <button 
                onClick={() => setShowDebugModal(false)}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-[11px] uppercase transition-all"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros SVG para Simulación de Relieve 3D Fotorrealista */}
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
        <defs>
          {/* Relieve Dorado de Bronce Soldado */}
          <filter id="bronce-relieve-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="2" specularConstant="1.5" specularExponent="18" lightingColor="#ffffff" result="specular">
              <feDistantLight azimuth={135} elevation={45} />
            </feSpecularLighting>
            <feComposite in="specular" in2="SourceGraphic" operator="in" result="spec-on-graphic" />
            <feOffset in="SourceAlpha" dx="1" dy="1.5" result="offset" />
            <feGaussianBlur in="offset" stdDeviation="1" result="shadow-blur" />
            <feComponentTransfer in="shadow-blur" result="shadow-alpha">
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="shadow-alpha" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="spec-on-graphic" />
            </feMerge>
          </filter>

          {/* Grabado Láser Hundido Quemado */}
          <filter id="laser-quemado-filter" x="-10%" y="-10%" width="120%" height="120%">
            <feOffset dx="-0.8" dy="-0.8" in="SourceAlpha" result="offset" />
            <feGaussianBlur in="offset" stdDeviation="0.8" result="blur" />
            <feComposite operator="out" in="SourceGraphic" in2="blur" result="inverse" />
            <feFlood floodColor="#000000" floodOpacity="0.8" result="shadow-color" />
            <feComposite operator="in" in="shadow-color" in2="inverse" result="inner-shadow" />
            <feOffset dx="0.5" dy="0.5" in="SourceAlpha" result="offset-light" />
            <feGaussianBlur in="offset-light" stdDeviation="0.5" result="blur-light" />
            <feSpecularLighting in="blur-light" surfaceScale="1" specularConstant="0.6" specularExponent="10" lightingColor="#ffffff" result="light">
              <feDistantLight azimuth={135} elevation={65} />
            </feSpecularLighting>
            <feComposite in="light" in2="SourceAlpha" operator="in" result="light-clean" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="inner-shadow" />
              <feMergeNode in="light-clean" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}

