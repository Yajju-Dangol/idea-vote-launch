import { LucideProps, Loader2 } from "lucide-react";

// Basic Spinner using lucide-react
const Spinner = (props: LucideProps) => (
  <Loader2 {...props} />
);

// Basic Google Logo SVG (replace with a better one if desired)
const Google = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="1em" height="1em" {...props}>
    <path fill="#EA4335" d="M24 9.5c3.46 0 6.47 1.19 8.86 3.45l6.74-6.74C35.9 2.59 30.43 0 24 0 14.41 0 6.38 5.55 2.81 13.55l7.71 6.01C12.22 13.38 17.63 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.63 24.5c0-1.66-.15-3.29-.43-4.87H24v9.17h12.83c-.55 2.98-2.17 5.52-4.62 7.25l7.66 5.97C43.89 38.03 46.63 31.83 46.63 24.5z"/>
    <path fill="#FBBC05" d="M10.52 19.56C10.01 18.08 9.71 16.53 9.71 14.92s.3-3.16.81-4.64L2.81 4.27C1.04 7.55 0 11.08 0 14.92c0 3.84 1.04 7.37 2.81 10.65l7.71-6.01z"/>
    <path fill="#34A853" d="M24 48c6.43 0 11.9-2.12 15.87-5.75l-7.66-5.97c-2.16 1.45-4.91 2.3-7.91 2.3-6.4 0-11.83-4.1-13.75-9.72l-7.71 6.01C6.38 42.45 14.41 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export const Icons = {
  spinner: Spinner,
  google: Google,
}; 