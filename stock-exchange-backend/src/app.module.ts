import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { EventsModule } from './events/events.module';
import { SimulationModule } from './simulation/simulation.module';
import { BrokerModule } from './broker/broker.module';

@Module({
  imports: [AdminModule, EventsModule, SimulationModule, BrokerModule],
})
export class AppModule {}
