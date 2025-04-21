import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 md:p-12 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
        <a href="/" className="text-primary dark:text-primary-foreground hover:text-primary/80 dark:hover:text-primary-foreground/80 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
