import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class SocketIOAdapter extends IoAdapter {
  constructor(
    private app: INestApplication,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const corsOrigins = this.configService.get<string>('cors.origin') ?? '*';
    
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingInterval: 10000,
      pingTimeout: 5000,
      connectTimeout: 45000,
      maxHttpBufferSize: 1e6,
      transports: ['websocket', 'polling'],
    });

    return server;
  }
}