import { Controller, Post, Body } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { EventsGateway } from 'src/events/events.gateway';

class StartSimulationDto {
  speed: number;
  startDate: string;
}

@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('start')
  start(@Body() body: StartSimulationDto) {
    this.simulationService.startSimulation(body.speed, body.startDate);
    EventsGateway.server?.emit('simulation-started');
    return { message: 'Симуляция запущена' };
  }
  @Post('stop')
  stop() {
    this.simulationService.stopSimulation();
    return { message: 'Симуляция остановлена' };
  }
}
