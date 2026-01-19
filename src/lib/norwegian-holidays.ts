import { format, addDays } from "date-fns";

/**
 * Gauss-algoritmen for å beregne påskedato
 * Returnerer 1. påskedag for gitt år
 */
function calculateEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Returnerer en Map med alle norske helligdager for et gitt år
 * Nøkkel er dato i format "yyyy-MM-dd", verdi er helligdagsnavnet
 */
export function getNorwegianHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>();

  // Faste helligdager
  holidays.set(`${year}-01-01`, "1. nyttårsdag");
  holidays.set(`${year}-05-01`, "Arbeidernes dag");
  holidays.set(`${year}-05-17`, "Grunnlovsdagen");
  holidays.set(`${year}-12-25`, "1. juledag");
  holidays.set(`${year}-12-26`, "2. juledag");

  // Bevegelige helligdager (påskebasert)
  const easterSunday = calculateEasterSunday(year);

  holidays.set(
    format(addDays(easterSunday, -3), "yyyy-MM-dd"),
    "Skjærtorsdag"
  );
  holidays.set(
    format(addDays(easterSunday, -2), "yyyy-MM-dd"),
    "Langfredag"
  );
  holidays.set(format(easterSunday, "yyyy-MM-dd"), "1. påskedag");
  holidays.set(
    format(addDays(easterSunday, 1), "yyyy-MM-dd"),
    "2. påskedag"
  );
  holidays.set(
    format(addDays(easterSunday, 39), "yyyy-MM-dd"),
    "Kristi himmelfartsdag"
  );
  holidays.set(
    format(addDays(easterSunday, 49), "yyyy-MM-dd"),
    "1. pinsedag"
  );
  holidays.set(
    format(addDays(easterSunday, 50), "yyyy-MM-dd"),
    "2. pinsedag"
  );

  return holidays;
}

/**
 * Sjekker om en dato er en norsk helligdag
 */
export function isNorwegianHoliday(date: Date): boolean {
  const holidays = getNorwegianHolidays(date.getFullYear());
  return holidays.has(format(date, "yyyy-MM-dd"));
}

/**
 * Returnerer navnet på helligdagen hvis datoen er en helligdag, ellers null
 */
export function getNorwegianHolidayName(date: Date): string | null {
  const holidays = getNorwegianHolidays(date.getFullYear());
  return holidays.get(format(date, "yyyy-MM-dd")) || null;
}
