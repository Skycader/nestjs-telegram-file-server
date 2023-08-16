import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';

@Injectable()
export class AppService {
  constructor() {}

  getButtons(buttons: any[]) {
    let arr = [];
    for (let button of buttons) {
      arr.push(Markup.button.callback(button.text, button.action));
    }
    return arr;
  }
  renderButtons(buttons: any[]) {
    return Markup.inlineKeyboard(this.getButtons(buttons), {
      columns: 1,
    });
  }
}
