import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Industry = "metallurgy" | "mining_metallurgy" | "engineering" | "automotive" | "materials" | "robotics" | "energy";
export type JobType = "full_time" | "part_time" | "internship" | "research" | "contract";
export type JobStatus = "open" | "closed" | "draft";

export interface Company {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  website_url: string | null;
  careers_url: string | null;
  industry: string;
  country: string | null;
  description: string;
  headquarters: string | null;
  size: string | null;
  founded_year: number | null;
  featured: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  type: JobType;
  location: string | null;
  remote: boolean;
  apply_url: string | null;
  external_source: string | null;
  required_skills: string[];
  min_level: number;
  status: JobStatus;
  posted_by: string | null;
  posted_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill: string;
  proficiency: "beginner" | "intermediate" | "advanced";
  score: number;
  source: "auto" | "manual" | "ai";
  evidence: any;
  updated_at: string;
}

export interface PortfolioProject {
  id: string;
  user_id: string;
  title: string;
  description: string;
  role: string | null;
  outcomes: string | null;
  tags: string[];
  link_url: string | null;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useCareers() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<string[]>([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [companiesRes, jobsRes, cbmRes, jbmRes] = await Promise.all([
      supabase.from("companies" as any).select("*").order("featured", { ascending: false }).order("name"),
      supabase.from("jobs" as any).select("*, company:companies(*)").eq("status", "open").order("posted_at", { ascending: false }),
      user ? supabase.from("company_bookmarks" as any).select("company_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      user ? supabase.from("job_bookmarks" as any).select("job_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    setCompanies((companiesRes.data as unknown as Company[]) ?? []);
    setJobs((jobsRes.data as unknown as Job[]) ?? []);
    setBookmarkedCompanies(((cbmRes.data as any[]) ?? []).map((b) => b.company_id));
    setBookmarkedJobs(((jbmRes.data as any[]) ?? []).map((b) => b.job_id));
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const toggleCompanyBookmark = useCallback(async (companyId: string) => {
    if (!user) return;
    const isB = bookmarkedCompanies.includes(companyId);
    if (isB) {
      await supabase.from("company_bookmarks" as any).delete().eq("user_id", user.id).eq("company_id", companyId);
      setBookmarkedCompanies((p) => p.filter((id) => id !== companyId));
    } else {
      await supabase.from("company_bookmarks" as any).insert({ user_id: user.id, company_id: companyId });
      setBookmarkedCompanies((p) => [...p, companyId]);
    }
  }, [user, bookmarkedCompanies]);

  const toggleJobBookmark = useCallback(async (jobId: string) => {
    if (!user) return;
    const isB = bookmarkedJobs.includes(jobId);
    if (isB) {
      await supabase.from("job_bookmarks" as any).delete().eq("user_id", user.id).eq("job_id", jobId);
      setBookmarkedJobs((p) => p.filter((id) => id !== jobId));
    } else {
      await supabase.from("job_bookmarks" as any).insert({ user_id: user.id, job_id: jobId });
      setBookmarkedJobs((p) => [...p, jobId]);
    }
  }, [user, bookmarkedJobs]);

  return { companies, jobs, bookmarkedCompanies, bookmarkedJobs, loading, refresh, toggleCompanyBookmark, toggleJobBookmark };
}

export async function fetchCompanyJobs(companyId: string): Promise<Job[]> {
  const { data } = await supabase.from("jobs" as any).select("*").eq("company_id", companyId).eq("status", "open").order("posted_at", { ascending: false });
  return (data as unknown as Job[]) ?? [];
}

export async function fetchUserSkills(userId: string): Promise<UserSkill[]> {
  const { data } = await supabase.from("user_skills" as any).select("*").eq("user_id", userId).order("score", { ascending: false });
  return (data as unknown as UserSkill[]) ?? [];
}

export async function fetchPortfolio(userId: string): Promise<PortfolioProject[]> {
  const { data } = await supabase.from("portfolio_projects" as any).select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data as unknown as PortfolioProject[]) ?? [];
}

export async function evaluateSkills(): Promise<{ skills: UserSkill[]; summary: any } | null> {
  const { data, error } = await supabase.functions.invoke("career-assistant", {
    body: { action: "evaluate_skills" },
  });
  if (error) {
    console.warn("evaluateSkills failed:", error);
    return null;
  }
  return data as any;
}

export async function getCareerAdvice(goal?: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("career-assistant", {
    body: { action: "career_advice", goal },
  });
  if (error) {
    console.warn("career advice failed:", error);
    return "Unable to generate advice right now. Please try again.";
  }
  return (data as any)?.content ?? "";
}

export interface JobFitEvidenceRef {
  type: "course" | "scenario" | "project" | "activity";
  id: string;
  label: string;
  href: string;
}

export interface JobFitGapResource {
  id: string;
  title: string;
  type: string;
  url: string;
  difficulty?: string;
}

export interface JobFitGapCourse {
  id: string;
  title: string;
  href: string;
}

export interface JobFit {
  fit_score: number;
  fit_summary: string;
  top_matches: { skill: string; evidence: string; refs?: JobFitEvidenceRef[] }[];
  transferable_strengths: { skill: string; why_relevant: string }[];
  gaps: { skill: string; how_to_close: string; resources?: JobFitGapResource[]; courses?: JobFitGapCourse[] }[];
  recommended_projects: { title: string; description: string; skills_built: string[] }[];
  application_tips: string[];
}

export async function matchJob(jobId: string): Promise<JobFit | null> {
  const { data, error } = await supabase.functions.invoke("career-assistant", {
    body: { action: "match_jobs", job_id: jobId },
  });
  if (error || !(data as any)?.fit) return null;
  return (data as any).fit as JobFit;
}

export type ApplicationStatus = "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn";

export interface JobApplication {
  id: string;
  job_id: string;
  company_id: string;
  user_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
  company?: Company;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  status: ApplicationStatus;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export async function applyToJob(args: { jobId: string; companyId: string; coverLetter?: string; resumeUrl?: string; }): Promise<JobApplication | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase
    .from("job_applications" as any)
    .insert({
      job_id: args.jobId,
      company_id: args.companyId,
      user_id: u.user.id,
      cover_letter: args.coverLetter ?? null,
      resume_url: args.resumeUrl ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.warn("applyToJob:", error);
    return null;
  }
  return data as unknown as JobApplication;
}

export async function fetchMyApplications(): Promise<JobApplication[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await supabase
    .from("job_applications" as any)
    .select("*, job:jobs(*), company:companies(*)")
    .eq("user_id", u.user.id)
    .order("created_at", { ascending: false });
  return (data as unknown as JobApplication[]) ?? [];
}

export async function fetchApplicationByJob(jobId: string): Promise<JobApplication | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("job_applications" as any)
    .select("*")
    .eq("user_id", u.user.id)
    .eq("job_id", jobId)
    .maybeSingle();
  return (data as unknown as JobApplication) ?? null;
}

export async function fetchApplicationEvents(applicationId: string): Promise<ApplicationEvent[]> {
  const { data } = await supabase
    .from("application_events" as any)
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  return (data as unknown as ApplicationEvent[]) ?? [];
}

export async function withdrawApplication(applicationId: string): Promise<boolean> {
  const { error } = await supabase.from("job_applications" as any).update({ status: "withdrawn" }).eq("id", applicationId);
  return !error;
}

export async function advanceApplication(applicationId: string, status: ApplicationStatus, note?: string): Promise<boolean> {
  // The trigger writes a status-change event, but we want a custom note attached to it.
  // Strategy: update the status, then insert a follow-up event with the note (if provided).
  const { error } = await supabase.from("job_applications" as any).update({ status }).eq("id", applicationId);
  if (error) {
    console.warn("advanceApplication:", error);
    return false;
  }
  if (note && note.trim()) {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("application_events" as any).insert({
      application_id: applicationId,
      status,
      note: note.trim(),
      created_by: u.user?.id ?? null,
    });
  }
  return true;
}

export async function addApplicationNote(applicationId: string, status: ApplicationStatus, note: string): Promise<boolean> {
  if (!note.trim()) return false;
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("application_events" as any).insert({
    application_id: applicationId,
    status,
    note: note.trim(),
    created_by: u.user?.id ?? null,
  });
  return !error;
}

// ============= Skill gap progress =============
export type SkillGapStatus = "todo" | "in_progress" | "done";

export interface SkillGapProgress {
  id: string;
  user_id: string;
  job_id: string;
  skill: string;
  status: SkillGapStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchSkillGapProgress(jobId: string): Promise<SkillGapProgress[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await supabase
    .from("skill_gap_progress" as any)
    .select("*")
    .eq("user_id", u.user.id)
    .eq("job_id", jobId);
  return (data as unknown as SkillGapProgress[]) ?? [];
}

export async function upsertSkillGapProgress(jobId: string, skill: string, status: SkillGapStatus, note?: string): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { error } = await supabase
    .from("skill_gap_progress" as any)
    .upsert(
      {
        user_id: u.user.id,
        job_id: jobId,
        skill,
        status,
        note: note ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,job_id,skill" },
    );
  return !error;
}

// Build the public portfolio URL for the current user (used to auto-fill resume URL)
export async function fetchMyPortfolioShareUrl(): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("portfolio_slug, portfolio_public")
    .eq("user_id", u.user.id)
    .maybeSingle();
  const slug = (data as any)?.portfolio_slug;
  const isPublic = (data as any)?.portfolio_public;
  if (!slug || !isPublic) return null;
  return `${window.location.origin}/#/p/${slug}`;
}


export interface PublicPortfolio {
  profile: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    bio: string | null;
    country: string | null;
    website_url: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    open_to_work: boolean;
    portfolio_slug: string | null;
  };
  skills: UserSkill[];
  projects: PortfolioProject[];
  badges: { id: string; unlocked_at: string; badge: { name: string; icon: string; category: string } }[];
  gamification: { level: number; total_xp: number; current_streak: number } | null;
}

export async function fetchPublicPortfolioBySlug(slug: string): Promise<PublicPortfolio | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url, headline, bio, country, website_url, linkedin_url, github_url, open_to_work, portfolio_slug, portfolio_public")
    .eq("portfolio_slug", slug)
    .maybeSingle();
  if (!profile || !(profile as any).portfolio_public) return null;
  const uid = (profile as any).user_id;
  const [sk, pr, bg, ga] = await Promise.all([
    supabase.from("user_skills" as any).select("*").eq("user_id", uid).order("score", { ascending: false }),
    supabase.from("portfolio_projects" as any).select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    supabase.from("user_badges" as any).select("id, unlocked_at, badge:badges(name, icon, category)").eq("user_id", uid),
    supabase.from("user_gamification" as any).select("level, total_xp, current_streak").eq("user_id", uid).maybeSingle(),
  ]);
  return {
    profile: profile as any,
    skills: (sk.data as unknown as UserSkill[]) ?? [],
    projects: (pr.data as unknown as PortfolioProject[]) ?? [],
    badges: (bg.data as any) ?? [],
    gamification: (ga.data as any) ?? null,
  };
}
