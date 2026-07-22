// Cambodia's official public holidays. Sourced from Sub-Decree No. 167 / Prakas No. 216/25
// (Ministry of Labour and Vocational Training), cross-checked across two independent sources
// 2026-07-22. Multi-day holidays (Khmer New Year, Pchum Ben, Water Festival) are listed one
// entry per calendar day. Update this list when a new year's schedule is officially published —
// dates for movable/lunar holidays (Khmer New Year, Visak Bochea, Royal Ploughing, Pchum Ben,
// Water Festival) are NOT the same each year.
export const KHMER_HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "International New Year's Day",
  "2026-01-07": "Victory over Genocide Day",
  "2026-03-08": "International Women's Day",
  "2026-04-14": "Khmer New Year",
  "2026-04-15": "Khmer New Year",
  "2026-04-16": "Khmer New Year",
  "2026-05-01": "Labour Day / Visak Bochea Day",
  "2026-05-05": "Royal Ploughing Ceremony",
  "2026-05-14": "King Norodom Sihamoni's Birthday",
  "2026-06-18": "Queen Mother's Birthday",
  "2026-09-24": "Constitution Day",
  "2026-10-10": "Pchum Ben Festival",
  "2026-10-11": "Pchum Ben Festival",
  "2026-10-12": "Pchum Ben Festival",
  "2026-10-15": "King Father's Commemoration Day",
  "2026-10-29": "King's Coronation Day",
  "2026-11-09": "Independence Day",
  "2026-11-23": "Water Festival (Bon Om Touk)",
  "2026-11-24": "Water Festival (Bon Om Touk)",
  "2026-11-25": "Water Festival (Bon Om Touk)",
  "2026-12-29": "Peace Day",
};

export function khmerHolidayOn(dateStr: string): string | null {
  return KHMER_HOLIDAYS_2026[dateStr] ?? null;
}
