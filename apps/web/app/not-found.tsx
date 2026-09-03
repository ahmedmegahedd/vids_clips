import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-md text-ink-soft">The page you’re looking for doesn’t exist or may have been moved.</p>
      <Button href="/" className="mt-6">
        Back to Dashboard
      </Button>
    </div>
  );
}
