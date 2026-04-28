import { forwardRef, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { SimulationModule } from 'src/simulation/simulation.module';

@Module({
  imports: [forwardRef(() => SimulationModule)],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
