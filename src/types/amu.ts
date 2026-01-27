// AMU (Arbeidsmiljøutvalg) module types

export type AMUMemberType = 'chair' | 'deputy_chair' | 'employee_rep' | 'employer_rep' | 'member';
export type AMUMeetingStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';
export type AMUAttendanceStatus = 'invited' | 'confirmed' | 'attended' | 'absent';
export type AMUMeetingRole = 'chair' | 'secretary' | 'member';
export type AMUAgendaItemStatus = 'pending' | 'discussed' | 'deferred';

export const AMU_MEMBER_TYPE_LABELS: Record<AMUMemberType, string> = {
  chair: 'Leder',
  deputy_chair: 'Nestleder',
  employee_rep: 'Ansattrepresentant',
  employer_rep: 'Arbeidsgiverrepresentant',
  member: 'Medlem'
};

export const AMU_MEETING_STATUS_LABELS: Record<AMUMeetingStatus, string> = {
  draft: 'Utkast',
  in_progress: 'Pågår',
  completed: 'Fullført',
  cancelled: 'Avlyst'
};

export const AMU_ATTENDANCE_STATUS_LABELS: Record<AMUAttendanceStatus, string> = {
  invited: 'Invitert',
  confirmed: 'Bekreftet',
  attended: 'Deltok',
  absent: 'Fraværende'
};

export interface AMUMember {
  id: string;
  profile_id: string;
  profile?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    department_id: string | null;
    departments?: { name: string };
  };
  title: string | null;
  member_type: AMUMemberType;
  appointed_date: string | null;
  expires_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AMUMeeting {
  id: string;
  meeting_number: number | null;
  title: string;
  description: string | null;
  meeting_date: string;
  meeting_time: string | null;
  location: string | null;
  status: AMUMeetingStatus;
  template_id: string | null;
  general_notes: string | null;
  pdf_url: string | null;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  participants?: AMUMeetingParticipant[];
  agenda_items?: AMUAgendaItem[];
}

export interface AMUMeetingParticipant {
  id: string;
  meeting_id: string;
  profile_id: string;
  profile?: {
    id: string;
    full_name: string;
    email: string;
  };
  attendance_status: AMUAttendanceStatus;
  role_in_meeting: AMUMeetingRole | null;
  created_at: string;
}

export interface AMUAgendaItem {
  id: string;
  meeting_id: string;
  sort_order: number;
  title: string;
  description: string | null;
  responsible_id: string | null;
  responsible?: {
    id: string;
    full_name: string;
  };
  notes: string | null;
  decision: string | null;
  status: AMUAgendaItemStatus;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface AMUAgendaTemplate {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  items?: AMUAgendaTemplateItem[];
  created_at: string;
  updated_at: string;
}

export interface AMUAgendaTemplateItem {
  id: string;
  template_id: string;
  sort_order: number;
  title: string;
  description: string | null;
  is_required: boolean;
  estimated_minutes: number | null;
  created_at: string;
}

export type MeetingWizardStep = 'general' | 'participants' | 'agenda' | 'notes' | 'summary';

export interface MeetingWizardData {
  meeting: Partial<AMUMeeting>;
  participants: Partial<AMUMeetingParticipant>[];
  agendaItems: Partial<AMUAgendaItem>[];
}
