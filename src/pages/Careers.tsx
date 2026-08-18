import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useCareers } from "@/hooks/useCareers";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Building2, Bookmark, BookmarkCheck, ExternalLink, Search, Sparkles, MapPin, Star } from "lucide-react";
import { CareerAssistantPanel } from "@/components/careers/CareerAssistantPanel";

const Careers = () => {
  const navigate = useNavigate();
  const { companies, jobs, bookmarkedCompanies, bookmarkedJobs, loading, toggleCompanyBookmark, toggleJobBookmark } = useCareers();
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");

  const industries = useMemo(() => Array.from(new Set(companies.map((c) => c.industry))).sort(), [companies]);
  const countries = useMemo(() => Array.from(new Set(companies.map((c) => c.country).filter(Boolean) as string[])).sort(), [companies]);

  const filteredCompanies = useMemo(() => {
    const q = search.toLowerCase();
    return companies.filter((c) => {
      if (industry !== "all" && c.industry !== industry) return false;
      if (country !== "all" && c.country !== country) return false;
      if (q && !`${c.name} ${c.description} ${c.country ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [companies, search, industry, country]);

  const industryLabel = (key: string) =>
    ({ metallurgy: "Metallurgy", mining_metallurgy: "Mining & Metallurgy", engineering: "Engineering", automotive: "Automotive", materials: "Materials", robotics: "Robotics", energy: "Energy" } as Record<string, string>)[key] ?? key;

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Briefcase className="w-6 h-6 text-accent" /> Careers</h1>
              <p className="text-sm text-muted-foreground mt-1">Discover companies, jobs, and AI-powered career guidance</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/portfolio/me")}>View my portfolio</Button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <Tabs defaultValue="companies" className="space-y-6">
            <TabsList className="bg-card border border-border h-auto p-1 gap-1">
              <TabsTrigger value="companies" className="gap-1.5"><Building2 className="w-3.5 h-3.5" /> Companies</TabsTrigger>
              <TabsTrigger value="jobs" className="gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Jobs & Internships</TabsTrigger>
              <TabsTrigger value="assistant" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Career Assistant</TabsTrigger>
              <TabsTrigger value="saved" className="gap-1.5"><Bookmark className="w-3.5 h-3.5" /> Saved</TabsTrigger>
            </TabsList>

            {/* COMPANIES */}
            <TabsContent value="companies" className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="px-3 py-2 rounded-md bg-background border border-border text-sm">
                  <option value="all">All industries</option>
                  {industries.map((i) => <option key={i} value={i}>{industryLabel(i)}</option>)}
                </select>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="px-3 py-2 rounded-md bg-background border border-border text-sm">
                  <option value="all">All countries</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading companies...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCompanies.map((c) => {
                    const isB = bookmarkedCompanies.includes(c.id);
                    return (
                      <Card key={c.id} className="p-5 hover:shadow-lg transition-shadow flex flex-col">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                            {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <h3 className="font-semibold text-foreground leading-tight truncate">{c.name}</h3>
                              {c.featured && <Star className="w-4 h-4 text-yellow-500 shrink-0" />}
                            </div>
                            {c.country && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {c.country}</p>}
                          </div>
                          <button onClick={() => toggleCompanyBookmark(c.id)} className="text-muted-foreground hover:text-accent transition-colors">
                            {isB ? <BookmarkCheck className="w-5 h-5 text-accent" /> : <Bookmark className="w-5 h-5" />}
                          </button>
                        </div>
                        <Badge variant="secondary" className="w-fit mb-2 text-xs">{industryLabel(c.industry)}</Badge>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{c.description}</p>
                        <div className="flex gap-2 mt-auto">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/careers/${c.id}`)}>Details</Button>
                          {c.website_url && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={c.website_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                  {filteredCompanies.length === 0 && (
                    <p className="col-span-full text-center text-sm text-muted-foreground py-12">No companies match your filters.</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* JOBS */}
            <TabsContent value="jobs" className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading jobs...</p>
              ) : jobs.length === 0 ? (
                <Card className="p-12 text-center">
                  <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No open jobs yet. Companies will post opportunities here.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {jobs.map((j) => {
                    const isB = bookmarkedJobs.includes(j.id);
                    return (
                      <Card key={j.id} className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{j.title}</h3>
                            <p className="text-sm text-muted-foreground">{j.company?.name} · {j.location ?? "Remote"} {j.remote && "· Remote"}</p>
                          </div>
                          <button onClick={() => toggleJobBookmark(j.id)} className="text-muted-foreground hover:text-accent">
                            {isB ? <BookmarkCheck className="w-5 h-5 text-accent" /> : <Bookmark className="w-5 h-5" />}
                          </button>
                        </div>
                        <div className="flex gap-2 flex-wrap mb-3">
                          <Badge variant="secondary" className="text-xs">{j.type.replace("_", " ")}</Badge>
                          {j.required_skills.slice(0, 4).map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{j.description}</p>
                        <div className="flex gap-2">
                          {j.apply_url && (
                            <Button size="sm" asChild>
                              <a href={j.apply_url} target="_blank" rel="noopener noreferrer">Apply <ExternalLink className="w-3.5 h-3.5 ml-1" /></a>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => navigate(`/careers/${j.company_id}`)}>View company</Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ASSISTANT */}
            <TabsContent value="assistant">
              <CareerAssistantPanel />
            </TabsContent>

            {/* SAVED */}
            <TabsContent value="saved" className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">Saved Companies</h3>
                {bookmarkedCompanies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved companies yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {companies.filter((c) => bookmarkedCompanies.includes(c.id)).map((c) => (
                      <Card key={c.id} className="p-4 cursor-pointer hover:shadow-md" onClick={() => navigate(`/careers/${c.id}`)}>
                        <div className="font-semibold text-sm text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{industryLabel(c.industry)} · {c.country}</div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">Saved Jobs</h3>
                {bookmarkedJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved jobs yet.</p>
                ) : (
                  <div className="space-y-2">
                    {jobs.filter((j) => bookmarkedJobs.includes(j.id)).map((j) => (
                      <Card key={j.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-foreground">{j.title}</p>
                          <p className="text-xs text-muted-foreground">{j.company?.name}</p>
                        </div>
                        {j.apply_url && (
                          <Button size="sm" asChild>
                            <a href={j.apply_url} target="_blank" rel="noopener noreferrer">Apply</a>
                          </Button>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Careers;
