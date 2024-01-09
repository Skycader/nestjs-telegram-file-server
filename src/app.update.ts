import { existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import {
  Action,
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
import { FileInterface } from './models/file.interface';
@Update()
export class AppUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly appService: AppService,
  ) {}

  @Start()
  async startCommand(ctx: Context) {
    const username = os.userInfo().username;
    ctx.session.lastPath = join('/', 'home', username);
    ctx.session.lastPage = 1;
    await ctx.reply(
      'This bot is a file server, type /help for list of commands',
    );
    let files = await this.getRawFiles('', 1);
    let renderedFiles = this.renderFiles(files);
    await ctx.reply(
      `Files in current folder:`,
      this.appService.renderButtons(renderedFiles),
    );
    // await ctx.reply('Что ты хочешь сделать?', this.appService.getButtons());
  }

  renderFiles(files: string[]) {
    let arr: FileInterface[] = [];

    arr.push({ text: '..', action: 'cd:..' });
    for (let file of files) {
      arr.push({
        text: file.slice(0, 100),
        action: this.defineAction(file).slice(0, 31),
      });
    }
    arr.push({ text: '<-', action: 'cd:prev-page' });
    arr.push({ text: '->', action: 'cd:next-page' });
    console.log(arr);
    return arr;
  }

  defineAction(filename: string) {
    if (filename.match(/folder/gi)) {
      return 'cd:' + filename;
    } else {
      return 'get:' + filename;
    }
  }

  @Action(/get:*/)
  async getFileByButton(@Ctx() ctx: Context) {
    let filename = ctx['match']['input'].split(':')[1].split('/')[0];
    if (existsSync(ctx.session.lastPath)) {
      ctx.reply('Getting fie: ' + ctx.session.lastPath + '/' + filename);
      await ctx.replyWithDocument({
        source: ctx.session.lastPath + '/' + filename,
      });
    } else {
      await ctx.reply('No such file');
    }
  }

  @Action(/cd:*/)
  async cdByButton(@Ctx() ctx: Context) {
    let path = ctx['match']['input'].split(':')[1].split('/')[0];
    console.log(path);
    if (path === 'next-page') {
      ctx.session.lastPage = ctx.session.lastPage * 1 + 1;
      await ctx.reply('Current page is now: ' + ctx.session.lastPage);

      let files = await this.getRawFiles(
        ctx.session.lastPath,
        ctx.session.lastPage,
      );
      let renderedFiles = this.renderFiles(files);
      // await ctx.reply(renderedFiles.join(''));
      await ctx.reply(
        `Files in current folder:`,
        this.appService.renderButtons(renderedFiles),
      );

      return;
    }
    if (path === 'prev-page') {
      ctx.session.lastPage = ctx.session.lastPage * 1 - 1;
      await ctx.reply('Current page is now: ' + ctx.session.lastPage);

      let files = await this.getRawFiles(
        ctx.session.lastPath,
        ctx.session.lastPage,
      );
      let renderedFiles = this.renderFiles(files);
      await ctx.reply(
        `Files in current folder:`,
        this.appService.renderButtons(renderedFiles),
      );

      return;
    }

    if (path === '..') {
      ctx.session.lastPath = ctx.session.lastPath
        .split('/')
        .slice(0, -1)
        .join('/');

      await ctx.reply(
        'Went up a folder, current path: ' + ctx.session.lastPath,
      );

      let files = await this.getRawFiles(ctx.session.lastPath, 1);
      let renderedFiles = this.renderFiles(files);
      await ctx.reply(
        `Files in current folder:`,
        this.appService.renderButtons(renderedFiles),
      );

      return;
    }
    ctx.session.lastPath = ctx.session.lastPath + '/' + path;
    ctx.session.lastPage = 1;
    await ctx.reply('Current path now: ' + ctx.session.lastPath);

    let files = await this.getRawFiles(
      ctx.session.lastPath,
      ctx.session.lastPage,
    );
    let renderedFiles = this.renderFiles(files);
    console.log('rendered files: ', renderedFiles);

    await ctx.reply(
      `Files in current folder:`,
      this.appService.renderButtons(renderedFiles),
    );
  }

  @Help()
  getHelp(ctx: Context) {
    ctx.reply(`List of commands:
    1. cd <path>
    2. get <file number>`);
  }

  renderSize(file) {
    if (file.isDirectory()) {
      return 'folder';
    } else {
      return (file.size / 1000 / 1000).toFixed(2) + 'MB';
    }
  }

  async getFiles(path: string = '', page: number = 1) {
    const username = os.userInfo().username;
    if (path.length === 0) path = join('/', 'home', username);
    console.log(path);
    if (existsSync(path)) {
      let files = await readdir(path);

      const stats = files.map((file) => stat(join(path, file)));
      let res = await Promise.all(stats);
      let sizes = res.map((file) => this.renderSize(file));
      // console.log(sizes);

      const filesWithSizes = files.map(
        (file, index) => file + '/' + sizes[index],
      );
      console.log(page - 1, page * 1 + 9);
      return filesWithSizes
        .slice(page - 1, page * 1 + 9)
        .map(
          (filename: string, index: number) =>
            index + page * 10 - 9 + ' ' + filename,
        )
        .join('\n\n');
    } else {
      return 'NO SUCH DIR AS' + path;
    }
  }

  async getRawFiles(path: string = '', page: number = 1): Promise<string[]> {
    const username = os.userInfo().username;
    if (path.length === 0) path = join('/', 'home', username);
    if (existsSync(path)) {
      const files = await readdir(path);
      const stats = files.map((file) => stat(join(path, file)));
      let res = await Promise.all(stats);
      let sizes = res.map((file) => this.renderSize(file));
      // console.log(sizes);

      const filesWithSizes = files.map(
        (file, index) => file + '/' + sizes[index],
      );

      return filesWithSizes.slice(page * 10 - 10, page * 10);
    } else {
      return ['NO SUCH DIR AS' + path];
    }
  }

  @Hears(/cd\s*/)
  async cd(@Message() message: any, @Ctx() ctx: Context) {
    const username = os.userInfo().username;
    if (message.text.split('_').length < 3) {
      await ctx.reply('You must always specify path and page');
      return;
    }
    let dir = message.text.split('_')[1];
    let page = message.text.split('_')[2] || 1;
    let path = join('/', 'home', username, dir);
    ctx.session.lastPath = path || '';
    ctx.session.lastPage = page || 1;
    await ctx.reply((await this.getFiles(path, page * 1)) || 'No files here');
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
    // await ctx.reply(
    //   await this.getFiles(ctx.session.lastPath, ctx.session.lastPage),
    // );

    let files = await this.getRawFiles(ctx.session.lastPath, 1);
    let renderedFiles = this.renderFiles(files);
    await ctx.reply(
      `Files in current folder:`,
      this.appService.renderButtons(renderedFiles),
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
