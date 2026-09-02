import { IsString, MinLength } from "class-validator";

export class ResolveVideoDto {
  @IsString()
  @MinLength(8)
  url!: string;
}
