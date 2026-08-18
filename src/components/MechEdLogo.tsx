import logoSrc from "@/assets/meched-logo.png";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, string> = {
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

interface MechEdLogoProps {
  size?: Size;
  className?: string;
  alt?: string;
}

export const MechEdLogo = ({ size = "md", className, alt = "MechED AI" }: MechEdLogoProps) => (
  <img
    src={logoSrc}
    alt={alt}
    draggable={false}
    className={cn(
      "object-contain select-none rounded-full bg-white",
      sizeMap[size],
      className,
    )}
  />
);

export default MechEdLogo;
