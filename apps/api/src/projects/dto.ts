import { Type } from "class-transformer";
import { IsIn, IsInt, IsObject, IsString, Max, Min } from "class-validator";
import { OUTPUT_FORMATS, type OutputFormat, type OutputOptions } from "@clipora/shared";

export class CreateProjectDto {
  @IsString()
  url!: string;

  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(180)
  clipSeconds!: number;

  @IsIn(OUTPUT_FORMATS)
  format!: OutputFormat;

  @IsObject()
  options!: OutputOptions;
}
