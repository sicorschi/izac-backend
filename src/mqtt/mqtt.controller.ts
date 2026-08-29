import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class MqttController {
  @MessagePattern('izac/#')
  handleIncomingMessage(@Payload() payload: any) {
    console.log('MQTT message received:', payload);
  }
}
