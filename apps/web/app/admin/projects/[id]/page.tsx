"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const project = useAdminStore((s) => s.projects.find((p) => p.id === id));
  if (!project) notFound();
  const mins = Math.floor(project.durationSeconds / 60);
  const secs = project.durationSeconds % 60;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <div className="mt-2"><StatusBadge kind="project" value={project.status} /></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="admin-card overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
        </div>
        <dl className="admin-card divide-y divide-[var(--line)] text-sm">
          {[
            ["Owner", project.userName],
            ["Source video", project.sourceVideo],
            ["Original duration", `${mins}m ${secs}s`],
            ["Clip length", `${project.clipSeconds}s`],
            ["Output format", project.format],
            ["Number of clips", String(project.clips)],
            ["Created", formatDateTime(project.createdAt)],
            ["Completed", project.completedAt ? formatDateTime(project.completedAt) : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 px-5 py-3">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <section>
        <h2 className="text-lg font-semibold">Generated clips</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {project.clipThumbnails.map((src, i) => (
            <div key={src + i} className="admin-card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-video w-full object-cover" />
              <p className="px-2 py-1.5 text-[11px] font-medium">Clip {i + 1}</p>
            </div>
          ))}
        </div>
      </section>
      <Link href={`/admin/users/${project.userId}`} className="text-sm font-semibold">View owner →</Link>
    </div>
  );
}
