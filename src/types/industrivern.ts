// Industrivern module types

export type IndustrivernRole = 
  | 'industrivernleder'
  | 'fagleder_industrivern'
  | 'innsatsperson'
  | 'redningsstab'
  | 'orden_sikring'
  | 'forstehjelp'
  | 'brannvern'
  | 'miljo_kjemikalievern'
  | 'kjemikaliedykker'
  | 'roykdykker';

export type ExerciseType = 
  | 'diskusjonsovelse'
  | 'delovelse'
  | 'praktisk'
  | 'fullskala'
  | 'reell_hendelse';

export type IVEquipmentCategory = 
  | 'personlig_verneutstyr'
  | 'forstehjelp'
  | 'brannvern'
  | 'kjemikalievern'
  | 'kommunikasjon'
  | 'annet';

export const INDUSTRIVERN_ROLE_LABELS: Record<IndustrivernRole, string> = {
  industrivernleder: 'Industrivernleder',
  fagleder_industrivern: 'Fagleder industrivern',
  innsatsperson: 'Innsatsperson',
  redningsstab: 'Redningsstab',
  orden_sikring: 'Orden og sikring',
  forstehjelp: 'Førstehjelp',
  brannvern: 'Brannvern',
  miljo_kjemikalievern: 'Miljø/kjemikalievern',
  kjemikaliedykker: 'Kjemikaliedykker',
  roykdykker: 'Røykdykker',
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  diskusjonsovelse: 'Diskusjonsøvelse',
  delovelse: 'Deløvelse',
  praktisk: 'Praktisk øvelse',
  fullskala: 'Fullskalaøvelse',
  reell_hendelse: 'Reell hendelse',
};

export const IV_EQUIPMENT_CATEGORY_LABELS: Record<IVEquipmentCategory, string> = {
  personlig_verneutstyr: 'Personlig verneutstyr',
  forstehjelp: 'Førstehjelp',
  brannvern: 'Brannvern',
  kjemikalievern: 'Kjemikalievern',
  kommunikasjon: 'Kommunikasjon',
  annet: 'Annet',
};

export interface IndustrivernOrganization {
  id: string;
  company_name: string;
  org_number: string;
  naeringskode: string;
  address: string | null;
  is_reinforced: boolean;
  reinforcement_types: string[] | null;
  avg_employees_per_year: number;
  nso_registered: boolean;
  nso_registration_date: string | null;
  nso_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IndustrivernPersonnel {
  id: string;
  profile_id: string;
  role: IndustrivernRole;
  is_deputy: boolean;
  deputy_for: string | null;
  emergency_phone: string | null;
  health_cert_date: string | null;
  health_cert_expires: string | null;
  health_cert_approved: boolean | null;
  is_active: boolean;
  appointed_date: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

export interface EmergencyPlan {
  id: string;
  version: number;
  version_date: string;
  approved_by: string | null;
  approved_date: string | null;
  status: 'draft' | 'active' | 'archived';
  organization_chart: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AlertPlan {
  id: string;
  emergency_plan_id: string | null;
  incident_type: string;
  alert_sequence: Array<{
    step: number;
    action: string;
    responsible: string | null;
  }>;
  notify_neighbors: boolean;
  neighbor_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionCard {
  id: string;
  emergency_plan_id: string | null;
  title: string;
  incident_type: string;
  target_role: IndustrivernRole | null;
  immediate_actions: string[];
  extended_actions: string[] | null;
  equipment_needed: string[] | null;
  safety_considerations: string[] | null;
  qr_code_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IndustrivernEquipment {
  id: string;
  category: IVEquipmentCategory;
  equipment_type: string;
  name: string;
  serial_number: string | null;
  inventory_number: string | null;
  location: string;
  location_details: string | null;
  status: 'ok' | 'needs_inspection' | 'needs_service' | 'defective' | 'retired';
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  inspection_interval_months: number;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface IndustrivernQualification {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  required_for_roles: IndustrivernRole[] | null;
  validity_months: number | null;
  training_hours: number | null;
  training_provider: string | null;
  external_certification: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonnelQualification {
  id: string;
  profile_id: string;
  qualification_id: string;
  achieved_date: string;
  expires_date: string | null;
  certificate_number: string | null;
  certificate_url: string | null;
  verified_by: string | null;
  verified_date: string | null;
  status: 'valid' | 'expiring_soon' | 'expired' | 'revoked';
  notes: string | null;
  created_at: string;
  updated_at: string;
  industrivern_qualifications?: IndustrivernQualification;
}

export interface IndustrivernExercise {
  id: string;
  title: string;
  description: string | null;
  exercise_type: ExerciseType;
  planned_date: string;
  planned_start: string | null;
  planned_end: string | null;
  location: string | null;
  incident_scenario: string | null;
  learning_objectives: string[] | null;
  target_roles: IndustrivernRole[] | null;
  external_participants: string[] | null;
  actual_date: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: 'planned' | 'completed' | 'cancelled' | 'postponed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseParticipant {
  id: string;
  exercise_id: string;
  profile_id: string;
  industrivern_role: IndustrivernRole | null;
  attended: boolean;
  attendance_notes: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface ExerciseEvaluation {
  id: string;
  exercise_id: string;
  objectives_met: boolean | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  observations: string | null;
  improvement_actions: Array<{
    action: string;
    responsible: string;
    deadline: string;
  }> | null;
  evaluated_by: string | null;
  evaluation_date: string;
  created_at: string;
  updated_at: string;
}

export interface IndustrivernIncident {
  id: string;
  incident_date: string;
  incident_type: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  title: string;
  description: string;
  location: string | null;
  injured_count: number;
  fatalities: number;
  external_impact: boolean;
  industrivern_activated: boolean;
  response_time_minutes: number | null;
  nødetater_called: boolean;
  actions_taken: string[] | null;
  lessons_learned: string | null;
  reported_to_nso: boolean;
  nso_report_date: string | null;
  reported_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseSchedule {
  id: string;
  year: number;
  is_reinforced: boolean;
  h1_exercises_planned: number;
  h1_exercises_completed: number;
  h2_exercises_planned: number;
  h2_exercises_completed: number;
  q1_exercises_planned: number;
  q1_exercises_completed: number;
  q2_exercises_planned: number;
  q2_exercises_completed: number;
  q3_exercises_planned: number;
  q3_exercises_completed: number;
  q4_exercises_planned: number;
  q4_exercises_completed: number;
  compliance_status: 'on_track' | 'behind' | 'compliant' | 'non_compliant';
  created_at: string;
  updated_at: string;
}

// Compliance calculation
export interface ComplianceItem {
  paragraph: string;
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  status: 'ok' | 'warning' | 'error';
  details: string;
}

export interface ComplianceResult {
  totalScore: number;
  items: ComplianceItem[];
}
