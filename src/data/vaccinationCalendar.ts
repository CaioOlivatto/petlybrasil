export interface VaccineItem {
  key: string;
  name: string;
  description: string;
  ageDays: number; // age in days when vaccine is due
  ageLabel: string;
  protectsAgainst?: string[];
  isAnnual?: boolean;
  isOptional?: boolean;
}

export const dogVaccines: VaccineItem[] = [
  {
    key: "dog_v10_1",
    name: "1ª dose V8/V10",
    description: "Primeira dose da vacina polivalente",
    ageDays: 45,
    ageLabel: "45 dias (1 mês e meio)",
    protectsAgainst: ["Cinomose", "Parvovirose", "Coronavirose", "Adenovírus", "Parainfluenza", "Leptospirose"],
  },
  {
    key: "dog_v10_2",
    name: "2ª dose V8/V10",
    description: "Reforço da primeira dose",
    ageDays: 66,
    ageLabel: "66 dias (~2 meses e 1 semana)",
  },
  {
    key: "dog_v10_3",
    name: "3ª dose V8/V10",
    description: "Completa o protocolo inicial",
    ageDays: 87,
    ageLabel: "87 dias (~3 meses)",
  },
  {
    key: "dog_rabies",
    name: "Vacina Antirrábica",
    description: "Protege contra Raiva",
    ageDays: 90,
    ageLabel: "90 a 120 dias (3 a 4 meses)",
    protectsAgainst: ["Raiva"],
  },
  {
    key: "dog_gripe",
    name: "Gripe Canina (Tosse dos Canis)",
    description: "Opcional / Recomendado dependendo da região",
    ageDays: 120,
    ageLabel: "120 dias (4 meses)",
    protectsAgainst: ["Bordetella", "Parainfluenza"],
    isOptional: true,
  },
  {
    key: "dog_annual_v10",
    name: "Reforço Anual V8/V10",
    description: "Reforço anual da polivalente",
    ageDays: 365,
    ageLabel: "1 ano de idade",
    isAnnual: true,
  },
  {
    key: "dog_annual_rabies",
    name: "Reforço Anual Antirrábica",
    description: "Reforço anual contra Raiva",
    ageDays: 365,
    ageLabel: "1 ano de idade",
    isAnnual: true,
  },
];

export const catVaccines: VaccineItem[] = [
  {
    key: "cat_v3_1",
    name: "1ª dose V3/V4/V5",
    description: "Primeira dose da vacina polivalente felina",
    ageDays: 60,
    ageLabel: "60 dias (2 meses)",
    protectsAgainst: ["Panleucopenia", "Calicivirose", "Rinotraqueíte"],
  },
  {
    key: "cat_v3_2",
    name: "2ª dose V3/V4/V5",
    description: "Segunda dose da polivalente felina",
    ageDays: 90,
    ageLabel: "90 dias (3 meses)",
  },
  {
    key: "cat_v3_3",
    name: "3ª dose V3/V4/V5",
    description: "Terceira dose da polivalente felina",
    ageDays: 120,
    ageLabel: "120 dias (4 meses)",
  },
  {
    key: "cat_rabies",
    name: "Vacina Antirrábica",
    description: "Protege contra Raiva",
    ageDays: 120,
    ageLabel: "120 dias (4 meses)",
    protectsAgainst: ["Raiva"],
  },
  {
    key: "cat_annual_v3",
    name: "Reforço Anual V3/V4/V5",
    description: "Reforço anual da polivalente felina",
    ageDays: 365,
    ageLabel: "1 ano de idade",
    isAnnual: true,
  },
  {
    key: "cat_annual_rabies",
    name: "Reforço Anual Antirrábica",
    description: "Reforço anual contra Raiva",
    ageDays: 365,
    ageLabel: "1 ano de idade",
    isAnnual: true,
  },
];

export const dewormingSchedule = [
  { ageDays: 15, label: "15 dias" },
  { ageDays: 30, label: "30 dias" },
  { ageDays: 45, label: "45 dias" },
  { ageDays: 60, label: "60 dias" },
  { ageDays: 90, label: "90 dias" },
];

export function getVaccinesForSpecies(species: string): VaccineItem[] {
  return species === "cat" ? catVaccines : dogVaccines;
}

export function getVaccineStatus(petAgeDays: number, vaccineAgeDays: number): "overdue" | "due" | "upcoming" {
  if (petAgeDays >= vaccineAgeDays + 30) return "overdue";
  if (petAgeDays >= vaccineAgeDays - 7) return "due";
  return "upcoming";
}
