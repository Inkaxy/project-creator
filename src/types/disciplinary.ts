// Disciplinary module types

export type DisciplinarySeverity = 'low' | 'medium' | 'high';
export type WarningType = 'verbal' | 'written_1' | 'written_2' | 'final' | 'suspension' | 'termination';
export type CaseStatus = 'draft' | 'pending_review' | 'pending_acknowledgment' | 'acknowledged' | 'disputed' | 'expired' | 'withdrawn';
export type ResponseType = 'acknowledged' | 'acknowledged_with_comment' | 'disputed';
export type MeetingType = 'initial_conversation' | 'formal_meeting' | 'follow_up' | 'drøftelsesmøte';
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface DisciplinaryCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DisciplinaryCase {
  id: string;
  case_number: string;
  employee_id: string;
  category_id: string;
  severity: DisciplinarySeverity;
  
  incident_date: string;
  incident_time: string | null;
  incident_description: string;
  incident_location: string | null;
  
  warning_type: WarningType;
  consequences_description: string | null;
  improvement_expectations: string | null;
  
  expiry_date: string | null;
  retention_reason: string | null;
  
  blocks_clock_in: boolean;
  blocks_timesheet: boolean;
  block_until_acknowledged: boolean;
  
  status: CaseStatus;
  
  created_by: string;
  reviewed_by: string | null;
  
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  acknowledged_at: string | null;
  expired_at: string | null;
  
  // Populated from joins
  employee?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
  category?: DisciplinaryCategory;
  created_by_user?: {
    id: string;
    full_name: string;
  };
  reviewed_by_user?: {
    id: string;
    full_name: string;
  };
  witnesses?: DisciplinaryWitness[];
  attachments?: DisciplinaryAttachment[];
  responses?: DisciplinaryResponse[];
  meetings?: DisciplinaryMeeting[];
}

export interface DisciplinaryWitness {
  id: string;
  case_id: string;
  employee_id: string | null;
  external_name: string | null;
  external_contact: string | null;
  role: 'witness' | 'involved' | 'reported_by';
  statement: string | null;
  created_at: string;
  employee?: {
    id: string;
    full_name: string;
  };
}

export interface DisciplinaryAttachment {
  id: string;
  case_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  description: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

export interface DisciplinaryResponse {
  id: string;
  case_id: string;
  employee_id: string;
  response_type: ResponseType;
  comment: string | null;
  signature_data: string | null;
  responded_at: string;
}

export interface DisciplinaryMeeting {
  id: string;
  case_id: string;
  meeting_type: MeetingType;
  scheduled_at: string;
  location: string | null;
  
  employee_id: string;
  manager_id: string;
  hr_representative_id: string | null;
  union_representative_id: string | null;
  employee_companion_name: string | null;
  
  agenda: string | null;
  minutes: string | null;
  outcome: string | null;
  follow_up_actions: string | null;
  
  status: MeetingStatus;
  completed_at: string | null;
  
  created_by: string;
  created_at: string;
}

export interface DisciplinaryRule {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  
  threshold_count: number;
  threshold_days: number;
  
  requires_previous_warning: boolean;
  required_previous_severity: DisciplinarySeverity | null;
  required_previous_days: number | null;
  
  suggested_severity: DisciplinarySeverity;
  suggested_warning_type: WarningType;
  
  suggest_block_clock_in: boolean;
  suggest_block_timesheet: boolean;
  
  is_active: boolean;
  sort_order: number;
  
  category?: DisciplinaryCategory;
}

export interface DisciplinaryIncident {
  id: string;
  employee_id: string;
  category_id: string;
  incident_date: string;
  incident_time: string | null;
  source_type: string;
  source_id: string | null;
  details: Record<string, unknown> | null;
  processed: boolean;
  case_id: string | null;
  created_at: string;
  
  employee?: {
    id: string;
    full_name: string;
  };
  category?: DisciplinaryCategory;
}

export interface DisciplinaryAuditLog {
  id: string;
  case_id: string;
  action: string;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  performed_by: string;
  performed_at: string;
  ip_address: string | null;
  
  performed_by_user?: {
    id: string;
    full_name: string;
  };
}

export interface DisciplinaryCaseFilter {
  status?: CaseStatus[];
  severity?: DisciplinarySeverity[];
  category_id?: string;
  employee_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface CreateDisciplinaryCaseInput {
  employee_id: string;
  category_id: string;
  severity: DisciplinarySeverity;
  incident_date: string;
  incident_time?: string;
  incident_description: string;
  incident_location?: string;
  warning_type: WarningType;
  consequences_description?: string;
  improvement_expectations?: string;
  expiry_date?: string;
  blocks_clock_in?: boolean;
  blocks_timesheet?: boolean;
}

export interface CreateDisciplinaryMeetingInput {
  case_id: string;
  meeting_type: MeetingType;
  scheduled_at: string;
  location?: string;
  employee_id: string;
  manager_id: string;
  hr_representative_id?: string;
  union_representative_id?: string;
  employee_companion_name?: string;
  agenda?: string;
}

// Helper functions
export const getSeverityLabel = (severity: DisciplinarySeverity): string => {
  const labels: Record<DisciplinarySeverity, string> = {
    low: 'Lav',
    medium: 'Middels',
    high: 'Høy',
  };
  return labels[severity];
};

export const getSeverityColor = (severity: DisciplinarySeverity): string => {
  const colors: Record<DisciplinarySeverity, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return colors[severity];
};

export const getWarningTypeLabel = (type: WarningType): string => {
  const labels: Record<WarningType, string> = {
    verbal: 'Muntlig advarsel',
    written_1: 'Skriftlig advarsel 1',
    written_2: 'Skriftlig advarsel 2',
    final: 'Endelig advarsel',
    suspension: 'Suspensjon',
    termination: 'Oppsigelse',
  };
  return labels[type];
};

export const getStatusLabel = (status: CaseStatus): string => {
  const labels: Record<CaseStatus, string> = {
    draft: 'Utkast',
    pending_review: 'Venter godkjenning',
    pending_acknowledgment: 'Venter kvittering',
    acknowledged: 'Kvittert',
    disputed: 'Bestridt',
    expired: 'Utløpt',
    withdrawn: 'Trukket tilbake',
  };
  return labels[status];
};

export const getStatusColor = (status: CaseStatus): string => {
  const colors: Record<CaseStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_review: 'bg-blue-100 text-blue-800',
    pending_acknowledgment: 'bg-yellow-100 text-yellow-800',
    acknowledged: 'bg-green-100 text-green-800',
    disputed: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-500',
    withdrawn: 'bg-gray-100 text-gray-500',
  };
  return colors[status];
};

export const getMeetingTypeLabel = (type: MeetingType): string => {
  const labels: Record<MeetingType, string> = {
    initial_conversation: 'Innledende samtale',
    formal_meeting: 'Formelt møte',
    follow_up: 'Oppfølgingsmøte',
    drøftelsesmøte: 'Drøftelsesmøte',
  };
  return labels[type];
};
