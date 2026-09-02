import { Module } from "@nestjs/common";
import { ProcessingService } from "./processing.service";
import { ProjectsStore } from "../projects/projects.store";
import { SupabaseModule } from "../supabase/supabase.module";

@Module({
  imports: [SupabaseModule],
  providers: [ProcessingService, ProjectsStore],
  exports: [ProcessingService, ProjectsStore],
})
export class ProcessingModule {}
