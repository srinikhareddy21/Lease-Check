export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ClauseCard {
  name: string;
  original?: string;
  plainEnglish: string;
  riskLevel: "low" | "medium" | "high";
  suggestion?: string;
}

export interface ImportantDate {
  label: string;
  date: string;
}

export interface OtherFee {
  name: string;
  amount: string;
}

export interface AnalysisResult {
  summary: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  keyTerms: Record<string, string>;
  importantDates: ImportantDate[];
  financial: {
    monthlyRent?: string;
    deposit?: string;
    lateFee?: string;
    earlyTerminationFee?: string;
    otherFees?: OtherFee[];
  };
  clauses: ClauseCard[];
  questions: string[];
  recommendations: string[];
}

export interface Analysis {
  id: string;
  status: "pending" | "complete" | "failed";
  error: string | null;
  summary: string | null;
  risk_score: number | null;
  risk_level: "low" | "medium" | "high" | null;
  result_json: AnalysisResult | null;
  created_at: string;
}

export interface Document {
  id: string;
  filename: string;
  file_size: number | null;
  source: "upload" | "demo";
  demo_id: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  latest_analysis: Analysis | null;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
  page: number;
  page_size: number;
}

export interface Notification {
  id: string;
  type: "analysis_complete" | "report_ready" | "upload_failed" | "export_complete";
  title: string;
  message: string;
  document_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Settings {
  theme: "light" | "dark" | "system";
  language: string;
  notify_analysis_complete: boolean;
  notify_report_ready: boolean;
  notify_upload_failed: boolean;
  notify_export_complete: boolean;
}

export interface DashboardStats {
  total_analyses: number;
  high_risk_count: number;
  safe_count: number;
  favorites_count: number;
  recent_activity: {
    document_id: string;
    filename: string;
    risk_level: string | null;
    status: string;
    updated_at: string;
  }[];
}

export interface DemoDoc {
  id: string;
  label: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
