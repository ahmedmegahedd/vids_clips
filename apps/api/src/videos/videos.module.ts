import { Module } from "@nestjs/common";
import { VideosController } from "./videos.controller";
import { YoutubeService } from "./youtube.service";

@Module({
  controllers: [VideosController],
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class VideosModule {}
