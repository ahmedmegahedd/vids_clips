"use client";

import { WorkflowStepper } from "@/components/workflow/WorkflowStepper";
import { VideoConfirm } from "@/components/workflow/VideoConfirm";
import { CustomizeClips } from "@/components/workflow/CustomizeClips";
import { ReviewClips } from "@/components/workflow/ReviewClips";
import { Logo } from "@/components/brand/Logo";
import { useWorkflow } from "@/lib/workflow-store";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function CreateInner() {
  const step = useWorkflow((s) => s.step);
  const resetAll = useWorkflow((s) => s.resetAll);
  const params = useSearchParams();
  const stepper = step === "customize" || step === "review" ? 2 : 1;

  useEffect(() => {
    if (params.get("new") === "1") resetAll();
  }, [params, resetAll]);

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between border-b border-[var(--line)] bg-white/70 px-4 backdrop-blur-md sm:px-6">
        <Logo />
        <Link href="/dashboard" className="text-sm font-medium text-ink-soft hover:text-ink">
          Your Videos
        </Link>
      </header>
      <WorkflowStepper current={stepper} />
      {step === "input" || step === "confirm" ? <VideoConfirm /> : null}
      {step === "customize" ? <CustomizeClips /> : null}
      {step === "review" ? <ReviewClips /> : null}
    </div>
  );
}

export function CreateExperience() {
  return (
    <Suspense>
      <CreateInner />
    </Suspense>
  );
}

