import { useNavigate } from "react-router-dom";
import { BookOpen, Users, FileText, ExternalLink, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { courses } from "@/data/courses";
import { experts } from "@/data/experts";
import { resources } from "@/data/resources";
import { cn } from "@/lib/utils";

// Build lookup maps for matching
const COURSE_MAP = courses.map((c) => ({
  id: c.id,
  title: c.title,
  icon: c.icon,
  description: c.description,
  duration: c.duration,
  lessons: c.lessons,
}));

const EXPERT_MAP = experts.map((e) => ({
  id: e.id,
  name: e.name,
  title: e.title,
  position: e.position,
  avatar: e.avatar,
  expertise: e.expertise,
}));

const RESOURCE_MAP = resources.map((r) => ({
  id: r.id,
  title: r.title,
  type: r.type,
  description: r.description,
  url: r.url,
}));

function findMatchedCourses(text: string) {
  return COURSE_MAP.filter(
    (c) =>
      text.toLowerCase().includes(c.title.toLowerCase()) ||
      text.includes(c.id)
  );
}

function findMatchedExperts(text: string) {
  const lower = text.toLowerCase();
  return EXPERT_MAP.filter((e) => {
    const nameParts = e.name.toLowerCase().split(" ");
    // Match if last name or full name appears
    return (
      lower.includes(e.name.toLowerCase()) ||
      nameParts.some((part) => part.length > 3 && lower.includes(part))
    );
  });
}

function findMatchedResources(text: string) {
  const lower = text.toLowerCase();
  return RESOURCE_MAP.filter((r) => lower.includes(r.title.toLowerCase()));
}

function CourseCard({ course }: { course: (typeof COURSE_MAP)[0] }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/course/${course.id}`)}
      className="flex items-center gap-3 w-full p-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-left group"
    >
      <span className="text-2xl shrink-0">{course.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {course.title}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {course.lessons} lessons · {course.duration}
        </p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
    </button>
  );
}

function ExpertCard({ expert }: { expert: (typeof EXPERT_MAP)[0] }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/experts/${expert.id}`)}
      className="flex items-center gap-3 w-full p-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-left group"
    >
      <span className="text-2xl shrink-0">{expert.avatar}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {expert.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {expert.title} · {expert.position}
        </p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
    </button>
  );
}

function ResourceCard({ resource }: { resource: (typeof RESOURCE_MAP)[0] }) {
  const typeIcons: Record<string, string> = {
    pdf: "📄",
    video: "🎬",
    link: "🔗",
    tool: "🛠️",
  };
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 w-full p-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-left group"
    >
      <span className="text-xl shrink-0">{typeIcons[resource.type] || "📄"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {resource.title}
        </p>
        <p className="text-[10px] text-muted-foreground capitalize">{resource.type}</p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
    </a>
  );
}

interface Props {
  content: string;
}

export function MentorResponseRenderer({ content }: Props) {
  const matchedCourses = findMatchedCourses(content);
  const matchedExperts = findMatchedExperts(content);
  const matchedResources = findMatchedResources(content);

  const hasCards = matchedCourses.length > 0 || matchedExperts.length > 0 || matchedResources.length > 0;

  return (
    <div className="space-y-2.5">
      {/* Markdown text */}
      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-foreground">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {/* Interactive cards */}
      {hasCards && (
        <div className="space-y-2 pt-1">
          {matchedCourses.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                <BookOpen className="w-3 h-3" />
                Courses
              </div>
              {matchedCourses.slice(0, 3).map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}

          {matchedExperts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                <Users className="w-3 h-3" />
                Experts
              </div>
              {matchedExperts.slice(0, 2).map((e) => (
                <ExpertCard key={e.id} expert={e} />
              ))}
            </div>
          )}

          {matchedResources.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                <FileText className="w-3 h-3" />
                Resources
              </div>
              {matchedResources.slice(0, 3).map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
