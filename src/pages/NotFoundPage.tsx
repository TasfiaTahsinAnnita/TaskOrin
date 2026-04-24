import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
      <h2 className="text-4xl font-bold text-slate-800">404</h2>
      <p>Page not found.</p>
      <Link to="/" className="text-blue-600 font-medium hover:underline">Go Home</Link>
    </div>
  );
}
