// CrewTalk - Medarbeidersamtaler Types

export type QuestionType = 'open' | 'rating' | 'yes_no';
export type LocationType = 'in_person' | 'video' | 'phone';
export type ConversationStatus = 'draft' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type ActionStatus = 'pending' | 'in_progress' | 'completed';
export type ActionPriority = 'low' | 'medium' | 'high';
export type NotificationType = 'invitation' | 'reminder' | 'confirmation' | 'cancelled' | 'action_reminder';
export type NotificationChannel = 'email' | 'sms' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface ConversationCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ConversationQuestion {
  id: string;
  category_id: string;
  question_text: string;
  description: string | null;
  question_type: QuestionType;
  is_default: boolean;
  tags: string[] | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  category?: ConversationCategory;
}

export interface ConversationTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  estimated_duration_minutes: number;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  questions?: ConversationTemplateQuestion[];
}

export interface ConversationTemplateQuestion {
  id: string;
  template_id: string;
  question_id: string;
  sort_order: number;
  is_required: boolean;
  question?: ConversationQuestion;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface Conversation {
  id: string;
  employee_id: string;
  manager_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  location: string | null;
  location_type: LocationType;
  status: ConversationStatus;
  template_id: string | null;
  manager_notes: string | null;
  employee_notes: string | null;
  summary: string | null;
  overall_rating: number | null;
  notification_settings: NotificationSettings;
  allow_employee_preparation: boolean;
  reminder_sent_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  manager?: {
    id: string;
    full_name: string;
    email: string;
  };
  template?: ConversationTemplate;
  responses?: ConversationResponse[];
  actions?: ConversationAction[];
}

export interface ConversationResponse {
  id: string;
  conversation_id: string;
  question_id: string;
  response_text: string | null;
  response_rating: number | null;
  manager_notes: string | null;
  is_skipped: boolean;
  sort_order: number;
  created_at: string;
  question?: ConversationQuestion;
}

export interface ConversationAction {
  id: string;
  conversation_id: string;
  title: string;
  description: string | null;
  responsible_id: string;
  due_date: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  completed_at: string | null;
  created_at: string;
  responsible?: {
    id: string;
    full_name: string;
  };
}

export interface ConversationNotification {
  id: string;
  conversation_id: string;
  recipient_id: string;
  notification_type: NotificationType;
  channel: NotificationChannel;
  subject: string | null;
  message: string;
  status: NotificationStatus;
  sent_at: string | null;
  scheduled_for: string;
  created_at: string;
}

// Form types
export interface CreateConversationInput {
  employee_ids: string[];
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes: number;
  location?: string;
  location_type: LocationType;
  template_id?: string;
  question_ids: string[];
  notification_settings: NotificationSettings;
  allow_employee_preparation: boolean;
}

export interface UpdateConversationInput {
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  location?: string;
  location_type?: LocationType;
  status?: ConversationStatus;
  manager_notes?: string;
  employee_notes?: string;
  summary?: string;
  overall_rating?: number;
}

export interface CreateResponseInput {
  conversation_id: string;
  question_id: string;
  response_text?: string;
  response_rating?: number;
  manager_notes?: string;
  is_skipped?: boolean;
  sort_order: number;
}

export interface CreateActionInput {
  conversation_id: string;
  title: string;
  description?: string;
  responsible_id: string;
  due_date?: string;
  priority?: ActionPriority;
}

export interface ConversationFilters {
  status?: ConversationStatus | 'all';
  employee_id?: string;
  manager_id?: string;
  from_date?: string;
  to_date?: string;
}

// Selected question for wizard
export interface SelectedQuestion {
  id: string;
  question: ConversationQuestion;
  sort_order: number;
  is_required: boolean;
}
