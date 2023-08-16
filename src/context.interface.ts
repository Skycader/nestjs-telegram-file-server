import { Context as ContextTelegraf } from 'telegraf';

export interface Context extends ContextTelegraf {
  session: {
    lastCommand: string;
    lastPath: string;
    lastPage: number;
  };
}
