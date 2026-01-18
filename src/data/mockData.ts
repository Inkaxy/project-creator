export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Daglig leder" | "Avdelingsleder" | "Baker" | "Selger" | "Ekstrahjelp";
  department: string;
  status: "active" | "inactive" | "pending";
  employeeType: "Fast ansatt" | "Fast deltid" | "Tilkalling" | "Lærling";
  startDate: string;
  functions: string[];
  hmsRoles?: string[];
}

export const employees: Employee[] = [
  {
    id: "1",
    name: "Anders Bakke",
    email: "anders@bakeri.no",
    phone: "912 34 567",
    role: "Daglig leder",
    department: "Administrasjon",
    status: "active",
    employeeType: "Fast ansatt",
    startDate: "2020-01-15",
    functions: ["Alle"],
    hmsRoles: ["Daglig leder", "HMS-ansvarlig"],
  },
  {
    id: "2",
    name: "Maria Hansen",
    email: "maria@bakeri.no",
    phone: "923 45 678",
    role: "Baker",
    department: "Produksjon",
    status: "active",
    employeeType: "Fast ansatt",
    startDate: "2021-03-01",
    functions: ["Stek Natt", "Baker", "Bollemaskin"],
  },
  {
    id: "3",
    name: "Erik Olsen",
    email: "erik@bakeri.no",
    phone: "934 56 789",
    role: "Baker",
    department: "Produksjon",
    status: "active",
    employeeType: "Fast ansatt",
    startDate: "2019-08-15",
    functions: ["Stek Natt", "Vekkgjøring", "Baker"],
    hmsRoles: ["Verneombud"],
  },
  {
    id: "4",
    name: "Lisa Johansen",
    email: "lisa@bakeri.no",
    phone: "945 67 890",
    role: "Selger",
    department: "Butikk",
    status: "active",
    employeeType: "Fast deltid",
    startDate: "2022-05-01",
    functions: ["Kasse", "Butikk"],
  },
  {
    id: "5",
    name: "Thomas Berg",
    email: "thomas@bakeri.no",
    phone: "956 78 901",
    role: "Ekstrahjelp",
    department: "Butikk",
    status: "pending",
    employeeType: "Tilkalling",
    startDate: "2024-01-10",
    functions: ["Kasse"],
  },
  {
    id: "6",
    name: "Sara Nilsen",
    email: "sara@bakeri.no",
    phone: "967 89 012",
    role: "Baker",
    department: "Produksjon",
    status: "active",
    employeeType: "Lærling",
    startDate: "2023-08-01",
    functions: ["Baker", "Bollemaskin"],
  },
];

export interface Shift {
  id: string;
  date: string;
  function: string;
  employeeId: string | null;
  employeeName: string | null;
  startTime: string;
  endTime: string;
  isNight: boolean;
  clockIn?: string;
  clockOut?: string;
  status: "planned" | "completed" | "open";
}

export const shifts: Shift[] = [
  {
    id: "1",
    date: "2026-01-19",
    function: "Stek Natt",
    employeeId: "2",
    employeeName: "Maria Hansen",
    startTime: "01:30",
    endTime: "09:00",
    isNight: true,
    status: "planned",
  },
  {
    id: "2",
    date: "2026-01-19",
    function: "Vekkgjøring",
    employeeId: "3",
    employeeName: "Erik Olsen",
    startTime: "04:00",
    endTime: "12:00",
    isNight: true,
    status: "planned",
  },
  {
    id: "3",
    date: "2026-01-19",
    function: "Baker",
    employeeId: "6",
    employeeName: "Sara Nilsen",
    startTime: "06:00",
    endTime: "14:00",
    isNight: false,
    status: "planned",
  },
  {
    id: "4",
    date: "2026-01-19",
    function: "Butikk",
    employeeId: "4",
    employeeName: "Lisa Johansen",
    startTime: "07:00",
    endTime: "15:00",
    isNight: false,
    status: "planned",
  },
  {
    id: "5",
    date: "2026-01-19",
    function: "Butikk Kveld",
    employeeId: null,
    employeeName: null,
    startTime: "14:00",
    endTime: "21:00",
    isNight: false,
    status: "open",
  },
  {
    id: "6",
    date: "2026-01-20",
    function: "Stek Natt",
    employeeId: "3",
    employeeName: "Erik Olsen",
    startTime: "01:30",
    endTime: "09:00",
    isNight: true,
    status: "planned",
  },
  {
    id: "7",
    date: "2026-01-20",
    function: "Baker",
    employeeId: "2",
    employeeName: "Maria Hansen",
    startTime: "06:00",
    endTime: "14:00",
    isNight: false,
    status: "planned",
  },
];

export interface PendingApproval {
  id: string;
  type: "absence" | "shift_swap" | "overtime" | "expense";
  employeeId: string;
  employeeName: string;
  description: string;
  date: string;
  status: "pending";
}

export const pendingApprovals: PendingApproval[] = [
  {
    id: "1",
    type: "absence",
    employeeId: "4",
    employeeName: "Lisa Johansen",
    description: "Ferie 20-24. januar (5 dager)",
    date: "2026-01-15",
    status: "pending",
  },
  {
    id: "2",
    type: "shift_swap",
    employeeId: "2",
    employeeName: "Maria Hansen",
    description: "Bytteforespørsel: 21. jan → Erik Olsen",
    date: "2026-01-16",
    status: "pending",
  },
  {
    id: "3",
    type: "overtime",
    employeeId: "3",
    employeeName: "Erik Olsen",
    description: "Overtid 18. jan: 2 timer ekstra",
    date: "2026-01-18",
    status: "pending",
  },
];

export const functions = [
  { id: "1", name: "Stek Natt", color: "destructive", department: "Produksjon" },
  { id: "2", name: "Vekkgjøring", color: "warning", department: "Produksjon" },
  { id: "3", name: "Baker", color: "primary", department: "Produksjon" },
  { id: "4", name: "Bollemaskin", color: "primary", department: "Produksjon" },
  { id: "5", name: "Butikk", color: "success", department: "Butikk" },
  { id: "6", name: "Butikk Kveld", color: "success", department: "Butikk" },
  { id: "7", name: "Kasse", color: "success", department: "Butikk" },
];
