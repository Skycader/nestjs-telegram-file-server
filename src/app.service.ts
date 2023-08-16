import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';

@Injectable()
export class AppService {
  constructor() {}

  getButtons() {
    return Markup.inlineKeyboard(
      [
        Markup.button.callback('📔 Список дел', 'list'),
        Markup.button.callback('📝 Редактирование', 'edit'),
        Markup.button.callback('❌ Удаление', 'delete'),
      ],
      {
        columns: 2,
      },
    );
  }
}
