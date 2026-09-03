"use client";

import { PlanEditor } from "@/components/admin/PlanEditor";
import { useParams } from "next/navigation";

export default function EditPlanPage() {
  const { id } = useParams<{ id: string }>();
  return <PlanEditor planId={id} />;
}
