import { Controller, Get, Post, Body, Patch, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Broker } from '../common/interfaces/models.interface';

class CreateBrokerDto {
  name: string;
  balance: number;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('historical/:ticker')
  getHistoricalData(@Param('ticker') ticker: string) {
    return this.adminService.getHistoricalDataFor(ticker);
  }

  @Get('brokers')
  getAllBrokers(): Promise<Broker[]> {
    return this.adminService.getAllBrokers();
  }

  @Post('brokers')
  createBroker(@Body() createBrokerDto: CreateBrokerDto): Promise<Broker> {
    return this.adminService.createBroker(createBrokerDto);
  }

  @Patch('brokers/:id')
  updateBroker(@Param('id', ParseIntPipe) id: number, @Body() updateData: { balance: number }) {
    return this.adminService.updateBroker(id, updateData);
  }

  @Delete('brokers/:id')
  deleteBroker(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteBroker(id);
  }

  @Get('config')
  getConfig() {
    return this.adminService.getConfig();
  }

  @Post('config')
  updateConfig(@Body() newConfig: { activeTickers: string[] }) {
    return this.adminService.updateConfig(newConfig);
  }

  @Get('stocks')
  getAllStocks() {
    return this.adminService.getAllAvailableStocks();
  }
}
