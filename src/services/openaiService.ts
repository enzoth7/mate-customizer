/**
 * Servicio para integrar la API de OpenAI (DALL-E 3 y GPT-4o-mini Vision) y generar renders del mate fotorrealistas.
 */

export interface OpenAIRequest {
  textoVirola: string;
  textoFleje: string;
  colorCuero: string;
  tipoModelo: string;
  materialVirola: string;
  tipoCincelado: string;
  logoBoquillaUrl?: string | null;
  logoFlejeUrl?: string | null;
  estiloTextoVirola?: string;
  estiloTextoFleje?: string;
  tipoFleje?: string;
  fotoMateRealUrl?: string | null;
  materialCuerpo?: string;
  nombreMate?: string;
}

/**
 * Obtiene la API Key de OpenAI. Prioriza una clave temporal en localStorage para facilitar pruebas/QA,
 * y luego cae en la variable de entorno de Vite.
 */
export function getOpenAIApiKey(): string {
  const tempKey = localStorage.getItem("TEMP_OPENAI_KEY");
  if (tempKey && tempKey.trim().startsWith("sk-")) {
    return tempKey.trim();
  }
  return (import.meta.env.VITE_OPENAI_KEY || "").trim();
}

/**
 * Guarda una API Key temporal en localStorage.
 */
export function saveTempApiKey(key: string) {
  if (!key) {
    localStorage.removeItem("TEMP_OPENAI_KEY");
  } else {
    localStorage.setItem("TEMP_OPENAI_KEY", key.trim());
  }
}

/**
 * Obtiene la lista de modelos disponibles para la clave actual.
 */
export async function listAvailableModels(apiKey: string): Promise<string[]> {
  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Error HTTP ${response.status} al listar modelos`);
  }

  const data = await response.json();
  return data.data.map((m: any) => m.id);
}

/**
 * Prueba la llamada a GPT-4o-mini para validar que la API Key sea funcional en general.
 */
export async function testGptModel(apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Error HTTP ${response.status} en Chat Completion`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Respuesta vacía";
}

/**
 * Prueba la generación de imagen directa con DALL-E 3.
 */
export async function testDallEModel(apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: "a tiny green apple, commercial studio shot, white background",
      n: 1,
      size: "1024x1024"
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Error HTTP ${response.status} en DALL-E 3`);
  }

  const data = await response.json();
  const item = data.data?.[0];
  if (item?.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }
  return item?.url || "No se devolvió URL";
}

export async function generateDynamicPromptWithVision(
  req: OpenAIRequest,
  apiKey: string,
  target: "fleje" | "virola" = "virola"
): Promise<string> {
  const systemPromptContent = target === "fleje"
    ? `You are a world-class AI prompt engineer specializing in industrial design, luxury leather goods, and professional studio product photography of customized mate cups.

Your task is to analyze the user's customized mate configuration (focused on the horizontal band or "fleje", leather body, and steel/brass chiselings) and write a highly detailed, localized description in English. This description will guide an Inpainting Diffusion model (Flux) to transform a flat, 2D composite text/logo overlaid on the middle band into a highly realistic 3D physical engraving.

Focus strictly on describing:
1. THE HORIZONTAL METAL BAND (FLEJE): Describe the texture of the metal (typically alpaca or steel), its position wrapping the middle waist of the cup.
2. THE STYLE OF THE ENGRAVING ON THE BAND:
   - Describe the chiseling pattern ("tipoCincelado", e.g. organic vines, geometric lines).
   - If a text or logo is present on the band ("textoFleje" or "logoFlejeUrl"): Describe it as "deeply hand-chiseled dark lines recessed into the metal waist band, showing metallic glints inside the grooves, crisp burnished edges, manual hammer-strike micro-indentations, and casting tiny micro-shadows that blend into the surrounding pattern."
3. THE PHYSICAL BLENDING: Avoid generating a prompt for a full new image. Describe only the horizontal middle band region and the text/logo texture, ensuring the leather body below and the metal rim above remain clean and physically consistent.

Respond ONLY with the generated English description. Do not include markdown code blocks, quotes, or conversational introductions.`
    : `You are a world-class AI prompt engineer specializing in industrial design and professional macro photography of luxury metal mouthpieces and circular engravings.

Your task is to analyze the user's customized mate configuration (focused on the flat upper metal mouthpiece or "virola" and its circular engraving) and write a highly detailed, localized macro description in English. This description will guide an Inpainting Diffusion model (Flux) to transform a flat, 2D circular composite text/logo overlaid on the top metal surface into a highly realistic 3D physical engraving.

Focus strictly on describing:
1. THE FLAT UPPER METAL RIM (VIROLA): Describe the wide, circular, flat metal mouthpiece (typically alpaca or steel) seen from a high-angle macro perspective, highlighting its smooth, satin-finished, or polished texture.
2. THE STYLE OF THE ENGRAVING ON THE RIM:
   - If "bronce_relieve" (raised brass/bronze): Describe it as "raised 3D gold-toned brass letters, physically welded in a circular path onto the flat metal mouthpiece, showing micro-welding joints at the edges, realistic metallic reflections, polished top highlights, and casting tiny physical shadows onto the surrounding steel."
   - If "laser_quemado" (laser engraving): Describe it as "a clean, dark-gray, deep circular laser-etched recess into the metal rim, showing matte textured inner grooves, crisp burnished edges, and physical depth with micro-shadows inside the cavities."
   - If "cincelado" (chiseled/embossed steel): Describe it as "hand-chiseled steel relief along the circular rim, showing manual hammer-strike micro-indentations, organic metallic reflections, and beveled edges integrated natively into the surrounding metal mouthpiece."
3. THE PHYSICAL BLENDING: Avoid generating a prompt for a full new image. Focus the description exclusively on the top circular mouthpiece and the text/logo texture. Keep it descriptive, concise, and optimized for low-strength inpainting.

Respond ONLY with the generated English description. Do not include markdown code blocks, quotes, or conversational introductions.`;

  const messages: any[] = [
    {
      role: "system",
      content: systemPromptContent
    }
  ];

  const userContent: any[] = [
    {
      type: "text",
      text: `User Configuration Options:
- Mate model: ${req.tipoModelo}
- Mate name: ${req.nombreMate || "Uruguayan mate cup"}
- Exact body material and color: ${req.materialCuerpo || "leather"} (${req.colorCuero})
- Metal rim material: ${req.materialVirola}
- Upper rim (virola) text: "${req.textoVirola}" (Style: ${req.estiloTextoVirola || "engraved"})
- Horizontal band (fleje) text: "${req.textoFleje}" (Style: ${req.estiloTextoFleje || "engraved"})
- Horizontal band pattern chosen: "${req.tipoFleje || "none"}"`
    }
  ];

  // Agregar imágenes
  if (req.fotoMateRealUrl) {
    userContent.push({
      type: "text",
      text: "Image 1 (Base Mate Cup chosen by the user):"
    });
    userContent.push({
      type: "image_url",
      image_url: {
        url: req.fotoMateRealUrl
      }
    });
  }

  if (req.logoBoquillaUrl) {
    userContent.push({
      type: "text",
      text: "Image 2 (Logo/Vector for the Upper Rim/Virola):"
    });
    userContent.push({
      type: "image_url",
      image_url: {
        url: req.logoBoquillaUrl
      }
    });
  }

  if (req.logoFlejeUrl) {
    userContent.push({
      type: "text",
      text: "Image 3 (Logo/Vector for the Horizontal Band/Fleje):"
    });
    userContent.push({
      type: "image_url",
      image_url: {
        url: req.logoFlejeUrl
      }
    });
  }

  messages.push({
    role: "user",
    content: userContent
  });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 350
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Error al generar prompt con GPT-4o-mini Vision");
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error in generateDynamicPromptWithVision:", error);
    // Fallback simple si la llamada a Vision falla
    return `A photorealistic high-end studio product photograph of a traditional Uruguayan mate cup of model ${req.tipoModelo} in ${req.colorCuero} leather, with a ${req.materialVirola} rim.`;
  }
}

export async function generateMateWithDallE(req: OpenAIRequest): Promise<{ urls: string[]; prompt: string }> {
  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    throw new Error("API Key de OpenAI no encontrada en VITE_OPENAI_KEY ni en localStorage. Por favor configúrala.");
  }

  // Generamos el prompt de manera dinámica y multimodal usando gpt-4o-mini con Vision
  const prompt = await generateDynamicPromptWithVision(req, apiKey);
  console.log("Constructed Multimodal Prompt:\n", prompt);

  try {
    const requestImage = async () => {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: prompt,
          n: 1,
          size: "1024x1024"
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Error al llamar al modelo de imagen");
      }

      const data = await response.json();
      const item = data.data?.[0];
      if (!item) {
        throw new Error("No se recibió ningún dato de imagen del servidor de OpenAI.");
      }
      if (item.b64_json) {
        return `data:image/png;base64,${item.b64_json}`;
      }
      return item.url || "";
    };

    // Lanzamos 1 variante (solicitada por el usuario para optimizar créditos y consistencia)
    const url = await requestImage();

    return { urls: [url], prompt };
  } catch (error) {
    console.error("Error en generateMateWithDallE:", error);
    throw error;
  }
}
