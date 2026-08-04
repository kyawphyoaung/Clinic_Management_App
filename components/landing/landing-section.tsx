import { cn } from "@/lib/utils";

type LandingSectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

export function LandingSection({
  id,
  children,
  className,
  containerClassName,
}: LandingSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-16 sm:py-20 lg:py-24", className)}>
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-5 sm:px-8",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
