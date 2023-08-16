import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import {
  Ctx,
  Hears,
  Help,
  InjectBot,
  Message,
  Start,
  Update,
} from 'nestjs-telegraf';
import * as os from 'os';
import { join } from 'path';
import { Telegraf } from 'telegraf';
import { AppService } from './app.service';
import { Context } from './context.interface';
@Update()
export class AppUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly appService: AppService,
  ) {}

  @Start()
  async startCommand(ctx: Context) {
    await ctx.reply(
      'This bot is a file server, type /help for list of commands',
    );
    // await ctx.reply('Что ты хочешь сделать?', this.appService.getButtons());
  }

  @Help()
  getHelp(ctx: Context) {
    ctx.reply(`List of commands:
    1. cd <path>
    2. get <file number>`);
  }

  async getFiles(path: string = '', page: number = 1) {
    const username = os.userInfo().username;
    if (path.length === 0) path = join('/', 'home', username);
    if (existsSync(path)) {
      const files = await readdir(path);
      return files
        .slice(page - 1, page + 9)
        .map(
          (filename: string, index: number) =>
            index + page * 10 - 9 + ' ' + filename,
        )
        .join('\n\n');
    } else {
      return 'NO SUCH DIR AS' + path;
    }
  }

  async getRawFiles(path: string = '', page: number = 1) {
    const username = os.userInfo().username;
    if (path.length === 0) path = join('/', 'home', username);
    if (existsSync(path)) {
      const files = await readdir(path);
      return files.slice(page - 1, page + 9);
    } else {
      return 'NO SUCH DIR AS' + path;
    }
  }

  @Hears(/cd\s*/)
  async cd(@Message() message: any, @Ctx() ctx: Context) {
    const username = os.userInfo().username;
    let dir = message.text.split(' ')[1];
    let page = message.text.split(' ')[2] || 1;
    let path = join('/', 'home', username, dir);
    ctx.session.lastPath = path || '';
    ctx.session.lastPage = page || 1;
    await ctx.reply(await this.getFiles(path, page * 1));
  }

  @Hears(/get\s*/)
  async getFile(@Ctx() ctx: Context, @Message() message: any) {
    const files = await this.getRawFiles(
      ctx.session.lastPath,
      ctx.session.lastPage,
    );
    const fileNumber = message.text.split(' ')[1];
    console.log(files);
    const path =
      ctx.session.lastPath +
      '/' +
      files[(fileNumber - 1 - 10 * (ctx.session.lastPage - 1)) * 1];

    if (existsSync(path)) {
      ctx.reply('Getting fie: ' + path);
      await ctx.replyWithDocument({
        source: path,
      });
    } else {
      await ctx.reply('No such file');
    }
  }

  @Hears('ls')
  async ls(ctx: Context) {
    await ctx.reply(
      await this.getFiles(ctx.session.lastPath, ctx.session.lastPage),
    );
  }

  @Hears('last')
  async getLastCommand(ctx: Context) {
    await ctx.reply(ctx.session.lastCommand || '');
  }

  // @Action('list')
  // getAll() {
  //   return 'OK';
  // }
}
