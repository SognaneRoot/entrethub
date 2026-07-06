// ─── Database types ────────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'premium';
export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'abandoned';
export type NotificationType = 'info' | 'success' | 'warning' | 'reminder';
export type GoalType = 'job_search' | 'skill_learning' | 'networking' | 'salary' | 'promotion';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface UserProfile {
  id: string;
  clerk_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  current_job: string | null;
  seniority: SeniorityLevel | null;
  target_job: string | null;
  subscription: SubscriptionPlan;
  created_at: string;
  updated_at: string;
}

export interface CV {
  id: string;
  user_id: string;
  title: string;
  content: CVContent;
  ats_score: number | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CVContent {
  personal_info: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages?: Language[];
  certifications?: Certification[];
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  current?: boolean;
  description: string[];
  technologies?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date?: string;
  gpa?: number;
}

export interface Language {
  name: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native';
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  job_title: string;
  difficulty: DifficultyLevel;
  duration_minutes: number | null;
  status: InterviewStatus;
  global_score: number | null;
  feedback: string | null;
  transcript: InterviewMessage[] | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
  score?: number;
}

export interface CareerGoal {
  id: string;
  user_id: string;
  type: GoalType;
  description: string;
  priority: 1 | 2 | 3;
  deadline: string | null;
  progress: number; // 0-100
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgressTracking {
  id: string;
  user_id: string;
  session_id: string | null;
  category: string;
  score: number;
  comments: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

// ─── UI / App types ────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
}
