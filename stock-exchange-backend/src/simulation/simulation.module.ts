import { Module, forwardRef } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';
import { EventsModule } from '../events/events.module';
import { AdminModule } from 'src/admin/admin.module';

@Module({
  imports: [forwardRef(() => EventsModule), AdminModule],
  providers: [SimulationService],
  controllers: [SimulationController],
  exports: [SimulationService],
})
export class SimulationModule {}
