export type RimFinishId = "finish-1" | "finish-2" | "finish-3";

export interface RimFinish {
  id: RimFinishId;
  name: string;
  image: string;
}

export const rimFinishCatalog: RimFinish[] = [
  { id: "finish-1", name: "Terminación 1", image: "/assets/virola/finishes/finish-1.png" },
  { id: "finish-2", name: "Terminación 2", image: "/assets/virola/finishes/finish-2.png" },
  { id: "finish-3", name: "Terminación 3", image: "/assets/virola/finishes/finish-3.png" },
];

export function getRimFinish(finishId: RimFinishId): RimFinish | undefined {
  return rimFinishCatalog.find((finish) => finish.id === finishId);
}
