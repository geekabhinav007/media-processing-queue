import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(WorkerModule);
  const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  shutdownSignals.forEach((signal) => {
    process.on(signal, async () => {
      await appContext.close();
      process.exit(0);
    });
  });
}

bootstrap().catch((error) => {
  console.error('Worker bootstrap failed', error);
  process.exit(1);
});
