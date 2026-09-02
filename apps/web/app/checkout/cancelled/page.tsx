import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export default function CancelledPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 text-center">
      <Logo />
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">Payment cancelled</h1>
      <p className="mt-3 text-ink-soft">No payment was completed and your plan has not been changed.</p>
      <Button href="/checkout" size="lg" className="mt-8 w-full">
        Return to Checkout
      </Button>
      <Button href="/pricing" variant="secondary" className="mt-3 w-full">
        Choose Another Plan
      </Button>
    </div>
  );
}
