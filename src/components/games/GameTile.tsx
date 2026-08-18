import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Props {
  to: string;
  icon: string;
  name: string;
  description: string;
  difficulty?: string;
  xp?: number;
}

export function GameTile({ to, icon, name, description, difficulty, xp }: Props) {
  return (
    <Link to={to}>
      <Card className="p-5 h-full hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <span className="text-4xl group-hover:scale-110 transition-transform">{icon}</span>
          {xp != null && (
            <Badge variant="outline" className="text-xs">
              +{xp} XP
            </Badge>
          )}
        </div>
        <h3 className="font-bold text-base mb-1">{name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{description}</p>
        {difficulty && (
          <Badge variant="secondary" className="text-[10px] capitalize">
            {difficulty}
          </Badge>
        )}
      </Card>
    </Link>
  );
}
