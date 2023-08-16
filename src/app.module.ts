import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import * as LocalSession from 'telegraf-session-local';
import { AppService } from './app.service';
import { AppUpdate } from './app.update';

const sessions = new LocalSession({ database: 'session_db.json' });
@Module({
  imports: [
    TelegrafModule.forRoot({
      middlewares: [sessions.middleware()],
      token: '6525070133:AAEIHE1bzcXcr__YSO_CpIFTtNUMqPBA65E',
    }),
  ],

  providers: [AppUpdate, AppService],
})
export class AppModule {}
