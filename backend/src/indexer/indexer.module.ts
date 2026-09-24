import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IndexerService } from './services/indexer.service';
import { IndexerGateway } from './gateways/indexer.gateway';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  providers: [IndexerService, IndexerGateway],
  exports: [IndexerService],
})
export class IndexerModule {}
