import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8",
};

function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin", sizeClasses[size], className)}
      {...props}
    />
  );
}

export { Spinner };
