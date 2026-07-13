/**
 * Servicio de integración con APIs de IA Generativa para Inpainting de Mates
 * Permite fundir letras y logotipos sobre la virola o el cuero de forma fotorrealista.
 */

interface InpaintRequest {
  image_url: string;
  mask_url: string;
  prompt: string;
}

interface FalResponse {
  image: {
    url: string;
    width: number;
    height: number;
  };
}

export async function generateMateRenderWithIA(req: InpaintRequest): Promise<string[]> {
  const falApiKey = import.meta.env.VITE_FAL_KEY;

  if (!falApiKey) {
    // Si no hay API Key configurada, lanzamos error para que el frontend use el flujo simulado (mock)
    throw new Error("API Key de fal.ai no encontrada en VITE_FAL_KEY. Ejecutando simulación de renderizado.");
  }

  try {
    // LLamada a fal.ai (usando el modelo rápido de inpainting SDXL o Flux)
    const response = await fetch("https://queue.coda.fal.run/fal-ai/fast-sdxl/inpainting", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${falApiKey}`
      },
      body: JSON.stringify({
        image_url: req.image_url,
        mask_url: req.mask_url,
        prompt: req.prompt,
        negative_prompt: "deformed, blurry, low quality, flat, black vector text, simple drawing, bad proportions",
        strength: 0.95,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        sync_mode: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error en la API de fal.ai: ${errText}`);
    }

    const data: FalResponse = await response.json();
    return [data.image.url];
  } catch (error) {
    console.error("Error al generar inpainting con IA:", error);
    throw error;
  }
}
