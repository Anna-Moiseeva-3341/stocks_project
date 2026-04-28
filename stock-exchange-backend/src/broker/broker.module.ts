import { Module, forwardRef } from '@nestjs/common';
import { BrokerController } from './broker.controller';
import { BrokerService } from './broker.service';
import { SimulationModule } from '../simulation/simulation.module';

@Module({
  imports: [forwardRef(() => SimulationModule)],
  controllers: [BrokerController],
  providers: [BrokerService],
  exports: [BrokerService],
})
export class BrokerModule {}
