import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: {
    regular: string
    gradient: string
  }
  description?: string
  ctaText?: string
  ctaHref?: string
  bottomImage?: {
    light: string
    dark: string
  }
  gridOptions?: {
    angle?: number
    cellSize?: number
    opacity?: number
    lightLineColor?: string
    darkLineColor?: string
  }
  children?: React.ReactNode; // Allow children to pass custom buttons
}

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "rgba(120, 119, 198, 0.15)", // Adjusted default color
  darkLineColor = "rgba(120, 119, 198, 0.2)", // Adjusted default color
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden [perspective:200px]",
        `opacity-[var(--opacity)]`,
      )}
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]" >
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent to-90%" />
    </div>
  )
}

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      title = "Build products for everyone",
      subtitle = {
        regular: "Designing your projects faster with ",
        gradient: "the largest figma UI kit.",
      },
      description = "Sed ut perspiciatis unde omnis iste natus voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.",
      ctaText, // Removed default CTA text
      ctaHref, // Removed default CTA href
      bottomImage = {
        // Using placeholder images - replace if needed
        light: "https://placehold.co/1200x600/png?text=App+Preview+Light",
        dark: "https://placehold.co/1200x600/000000/png?text=App+Preview+Dark",
      },
      gridOptions,
      children, // Accept children
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("relative overflow-hidden", className)} ref={ref} {...props}>
         {/* Background effects */}
        <div className="absolute -z-10 top-0 h-screen w-screen bg-background" />
        <div className="absolute -z-10 top-0 h-screen w-screen bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),transparent)] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),transparent)]" />
        <section className="relative max-w-full mx-auto z-10">
          <RetroGrid {...gridOptions} />
          <div className="max-w-screen-xl mx-auto px-4 py-28 gap-12 md:px-8"> {/* Increased py */}
            <div className="space-y-5 max-w-3xl mx-auto text-center">
              {/* Title */}
              {title && (
                <a href="#" className="inline-block text-sm text-primary group font-medium mx-auto px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full w-fit hover:bg-primary/20 transition-colors">
                  {title}
                  <ChevronRight className="inline w-4 h-4 ml-1 group-hover:translate-x-0.5 duration-300" />
                </a>
              )}
              {/* Subtitle */}
              <h2 className="text-4xl tracking-tighter font-bold mx-auto md:text-6xl text-foreground">
                {subtitle.regular}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-orange-300">
                  {subtitle.gradient}
                </span>
              </h2>
              {/* Description */}
              <p className="max-w-2xl mx-auto text-muted-foreground md:text-lg">
                {description}
              </p>
              {/* Call to Action Area - Render children if provided, otherwise default CTA */}
              <div className="items-center justify-center pt-4 gap-x-3 space-y-3 sm:flex sm:space-y-0">
                {children ? children : (
                  // Default CTA (only if ctaText is provided)
                  ctaText && ctaHref && (
                     <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
                       <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#a855f7_0%,#d946ef_50%,#a855f7_100%)]" />
                       <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-background px-8 py-3 text-sm font-medium text-foreground backdrop-blur-3xl">
                         <a href={ctaHref}>{ctaText}</a>
                       </div>
                     </span>
                  )
                )}
              </div>
            </div>
             {/* Bottom Image */} 
            {bottomImage && (
              <div className="mt-24 md:mt-32 mx-auto max-w-screen-lg relative z-10">
                <img
                  src={bottomImage.light}
                  className="w-full shadow-2xl rounded-lg border dark:hidden" // Adjusted shadow & border
                  alt="App preview light"
                />
                <img
                  src={bottomImage.dark}
                  className="hidden w-full shadow-2xl rounded-lg border border-muted dark:block" // Adjusted shadow & border
                  alt="App preview dark"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    )
  },
)
HeroSection.displayName = "HeroSection"

export { HeroSection } 