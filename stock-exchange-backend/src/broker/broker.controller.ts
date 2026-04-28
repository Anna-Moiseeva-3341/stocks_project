import { Controller, Post, Body } from '@nestjs/common';
import { BrokerService } from './broker.service';

class TransactionDto {
  brokerName: string;
  ticker: string;
  quantity: number;
}

@Controller('broker')
export class BrokerController {
  constructor(private readonly brokerService: BrokerService) {}

  @Post('buy')
  buy(@Body() body: TransactionDto) {
    return this.brokerService.buy(body.brokerName, body.ticker, body.quantity);
  }

  @Post('sell')
  sell(@Body() body: TransactionDto) {
    return this.brokerService.sell(body.brokerName, body.ticker, body.quantity);
  }
}
