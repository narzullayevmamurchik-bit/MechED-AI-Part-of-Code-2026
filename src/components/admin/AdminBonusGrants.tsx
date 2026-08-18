import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Award } from "lucide-react";
import { toast } from "sonner";

interface UserOpt { user_id: string; display_name: string; email: string }
interface BadgeOpt { id: string; code: string; name: string; icon: string }

export const AdminBonusGrants = () => {
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [badges, setBadges] = useState<BadgeOpt[]>([]);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("50");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("overall");
  const [badgeCode, setBadgeCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: u } = await supabase.rpc("admin_list_users" as any);
      setUsers(((u as any[]) ?? []).map((r) => ({ user_id: r.user_id, display_name: r.display_name, email: r.email })));
      const { data: b } = await supabase.from("badges" as any).select("id, code, name, icon").order("category");
      setBadges((b as unknown as BadgeOpt[]) ?? []);
    })();
  }, []);

  const grantXp = async () => {
    if (!userId || !amount) return toast.error("Pick a user and amount");
    setBusy(true);
    const { error } = await supabase.rpc("award_xp" as any, {
      _user_id: userId,
      _amount: parseInt(amount, 10),
      _source: "admin_grant",
      _category: category,
      _source_id: `admin-${Date.now()}`,
      _reason: reason || "Admin bonus",
      _awarded_by: null,
      _dedupe: false,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Granted ${amount} XP`);
    setReason("");
  };

  const grantBadge = async () => {
    if (!userId || !badgeCode) return toast.error("Pick a user and badge");
    setBusy(true);
    const { error } = await supabase.rpc("unlock_badge" as any, { _user_id: userId, _badge_code: badgeCode });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Badge granted");
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Grant bonus XP</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>{users.map((u) => (<SelectItem key={u.user_id} value={u.user_id}>{u.display_name} ({u.email})</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall</SelectItem>
                <SelectItem value="learner">Learner</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="contributor">Contributor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <Button onClick={grantXp} disabled={busy}>Grant XP</Button>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Award badge</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>{users.map((u) => (<SelectItem key={u.user_id} value={u.user_id}>{u.display_name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Badge</Label>
            <Select value={badgeCode} onValueChange={setBadgeCode}>
              <SelectTrigger><SelectValue placeholder="Select badge" /></SelectTrigger>
              <SelectContent>{badges.map((b) => (<SelectItem key={b.id} value={b.code}>{b.icon} {b.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={grantBadge} disabled={busy}>Award badge</Button>
      </Card>
    </div>
  );
};
