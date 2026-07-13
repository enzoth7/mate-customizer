import { fal } from "@fal-ai/client";

/**
 * Servicio para integrar la API de Fal.ai (Flux.1 Dev Inpainting) para renderizado ultra fiel.
 */

interface FalInpaintRequest {
  prompt: string;
  imageUrl: string; // Base64 data URI o URL pública de la imagen pre-estampada (composite)
  maskUrl: string;  // Base64 data URI o URL pública de la máscara silueta (tight mask)
  strength?: number; // Nivel de influencia del inpainting (0 a 1). Menor valor = más fidelidad al composite
  useControlNet?: boolean;
  controlImageUrl?: string; // Si se omite y useControlNet es true, se usará imageUrl para extraer bordes Canny
}

/**
 * Obtiene la API Key de Fal.ai. Prioriza localStorage para QA y pruebas rápidas,
 * y luego cae en la variable de entorno de Vite.
 */
export function getFalApiKey(): string {
  const tempKey = localStorage.getItem("TEMP_FAL_KEY");
  if (tempKey && tempKey.trim() !== "") {
    return tempKey.trim();
  }
  return (import.meta.env.VITE_FAL_KEY || "").trim();
}

/**
 * Guarda una clave temporal en localStorage para desarrollo/debugging.
 */
export function saveTempFalKey(key: string) {
  if (key) {
    localStorage.setItem("TEMP_FAL_KEY", key);
  } else {
    localStorage.removeItem("TEMP_FAL_KEY");
  }
}

/**
 * Sube una imagen Base64 a la CDN temporal de Fal.ai y retorna su URL pública (fal.media).
 */
async function uploadBase64ToFal(base64DataUri: string, apiKey: string): Promise<string> {
  if (!base64DataUri.startsWith("data:")) {
    return base64DataUri; // Ya es una URL HTTP/HTTPS
  }

  // Convertir base64 data URI a Blob
  const parts = base64DataUri.split(",");
  if (parts.length < 2) {
    throw new Error("Formato Base64 inválido para subida a Fal.ai");
  }
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
  const byteString = atob(parts[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeType });

  // Configurar credenciales dinámicamente en el SDK
  fal.config({ credentials: apiKey });

  // Subir usando el SDK oficial
  const fileUrl = await fal.storage.upload(blob);
  return fileUrl;
}

/**
 * Envía una tarea de inpainting de forma síncrona a Fal.ai y retorna el resultado.
 */
export async function generateMateInpainting(req: FalInpaintRequest): Promise<string> {
  const apiKey = getFalApiKey();
  if (!apiKey) {
    throw new Error("API Key de Fal.ai no encontrada. Configura VITE_FAL_KEY en .env o agrégala en Diagnósticos.");
  }

  // 1. Subir composite, máscara y opcionalmente imagen de control a la CDN de Fal.ai
  const uploadPromises: Promise<string>[] = [
    uploadBase64ToFal(req.imageUrl, apiKey),
    uploadBase64ToFal(req.maskUrl, apiKey)
  ];

  if (req.useControlNet && req.controlImageUrl) {
    uploadPromises.push(uploadBase64ToFal(req.controlImageUrl, apiKey));
  }

  const uploadedUrls = await Promise.all(uploadPromises);
  const hostedImageUrl = uploadedUrls[0];
  const hostedMaskUrl = uploadedUrls[1];
  const hostedControlImageUrl = req.useControlNet ? (uploadedUrls[2] || hostedImageUrl) : null;

  // Configurar credenciales dinámicamente en el SDK
  fal.config({ credentials: apiKey });

  // Construcción del payload dinámico de inpainting
  const inputPayload: any = {
    image_url: hostedImageUrl,
    mask_url: hostedMaskUrl,
    prompt: req.prompt,
    strength: req.strength ?? 0.30, // Denoising de oro
    guidance_scale: 3.5,
    num_inference_steps: 35
  };

  // Inyectar ControlNet Canny si es solicitado
  if (req.useControlNet && hostedControlImageUrl) {
    inputPayload.controlnets = [
      {
        path: "jasperai/Flux.1-dev-Controlnet-Canny",
        control_image_url: hostedControlImageUrl,
        conditioning_scale: 0.80,
        start_percentage: 0.0,
        end_percentage: 0.85
      }
    ];
  }

  const result: any = await fal.subscribe("fal-ai/flux-general/inpainting", {
    input: inputPayload
  });

  // 3. Extraer dinámicamente la URL de la imagen resultante del objeto result
  const data = result.data || result.output || result;
  const imageUrlResult = data.image?.url || data.Images?.[0]?.url || data.images?.[0]?.url || data.url || result.url;

  if (!imageUrlResult) {
    throw new Error(`El workflow procesó la imagen pero no se encontró la URL de salida en el resultado devuelto:
${JSON.stringify(result, null, 2)}`);
  }

  return imageUrlResult;
}

/**
 * Testea la conexión de Fal.ai haciendo un llamado rápido de prueba sincrónico al modelo Schnell.
 */
export async function testFalConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${apiKey}`
      },
      body: JSON.stringify({
        prompt: "a tiny metallic golden sphere",
        sync_mode: true
      })
    });
    return response.ok;
  } catch (error) {
    console.error("Error testing Fal.ai connection:", error);
    return false;
  }
}
