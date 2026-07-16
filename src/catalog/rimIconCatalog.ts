export interface RimIconAsset {
  id: string;
  name: string;
  src: string;
}

const rimIconModules = import.meta.glob<string>("../assets/icons/virola/*.{svg,png}", {
  eager: true,
  import: "default",
  query: "?url",
});

function createReadableName(filename: string): string {
  const words = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return words.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

export function createRimIconCatalog(modules: Record<string, string>): RimIconAsset[] {
  return Object.entries(modules)
    .map(([path, src]) => {
      const filename = path.split("/").pop() ?? path;
      return { id: filename.replace(/\.[^.]+$/, "").toLowerCase(), name: createReadableName(filename), src };
    })
    .sort((first, second) => first.name.localeCompare(second.name));
}

export const rimIconCatalog = createRimIconCatalog(rimIconModules);
