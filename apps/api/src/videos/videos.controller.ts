import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ResolveVideoDto } from "./dto";
import { YoutubeService } from "./youtube.service";

@Controller("videos")
export class VideosController {
  constructor(private readonly youtube: YoutubeService) {}

  @Post("resolve")
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async resolve(@Body() body: ResolveVideoDto) {
    const video = await this.youtube.resolve(body.url);
    return { video };
  }
}
