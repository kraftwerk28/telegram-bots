'use strict';

const fs = require('fs');


/*
button prototype
  text
  node OR appendForm  
  
keyboard prototype
  waitsForResponse
  start message
  keyboard
  
*/

exports.confirmOrder = {
  inline_keyboard: [
    [{ text: 'Да', callback_data: 'yes' }, { text: 'Нет', callback_data: 'no' }]
  ]
}

//#region deviver menu
// exports.cure = {
//   waiting: true,
//   startMessage: 'Какие лекарства нужно?',
//   keyboard: [
//     [{ text: 'Назад', node: 'deliver' }]
//   ],
//   resize_keyboard: true
// };
// exports.water = {
//   waiting: true,
//   startMessage: 'Где купить воду и сколько литров нужно?',
//   keyboard: [
//     [{ text: 'Назад', node: 'deliver' }]
//   ],
//   resize_keyboard: true
// };
// exports.cooked_food = {
//   waiting: true,
//   startMessage: 'Что именно?',
//   keyboard: [
//     [{ text: 'Назад', node: 'deliver' }]
//   ],
//   resize_keyboard: true
// };
// exports.tea_coffee = {
//   waiting: true,
//   startMessage: 'Что именно и в каком месте купить?',
//   keyboard: [
//     [{ text: 'Назад', node: 'deliver' }]
//   ],
//   resize_keyboard: true
// };

// exports.supermarket = {
//   waiting: true,
//   startMessage: 'Что именно?',
//   keyboard: [
//     [{ text: '"Фора"', content: '"Фора"', node: 'supermarket' }, { text: '"АТБ"', content: '"АТБ"', node: 'supermarket' }],
//     [{ text: '"МегаМаркет"', content: '"МегаМаркет"', node: 'supermarket' }, { text: '"Сильпо"', content: '"Сильпо"', node: 'supermarket' }],
//     [{ text: 'Другое' }],
//     [{ text: 'Назад', node: 'deliver' }]
//   ],
//   resize_keyboard: true
// };
// exports.other_stuff = {
//   waiting: true,
//   startMessage: 'Что именно, и в каком месте купить?',
//   keyboard: [
//     [{ text: 'Назад', node: 'deliver' }]
//   ],
//   resize_keyboard: true
// };
// //#endregion

// exports.deliver = {
//   startMessage: 'Выберите из нижеперечисленного.\nУказывайте детали заказа, написав сообщение боту.',
//   keyboard: [
//     [{ text: 'Лекарства', node: 'cure' }, { text: 'Вода', node: 'water' }],
//     [{ text: 'Готовая еда', node: 'cooked_food' }, { text: 'Кофе/Чай', node: 'tea_coffee' }],
//     [{ text: 'Из супермаркета', node: 'supermarket' }, { text: 'Другое', node: 'other_stuff' }],
//     [{ text: 'Назад', node: 'mainKeyboard' }]
//   ]
// };

// exports.about = {
//   startMessage: '<b>О нас:</b>',
//   // content: 'lol',
//   keyboard: [
//     [{ text: 'Назад', node: 'mainKeyboard' }]
//   ]
// };

// exports.prices = {
//   startMessage: '<b>Цены:</b>',
//   content: 'photo',
//   keyboard: [
//     [{ text: 'Назад', node: 'mainKeyboard' }]
//   ]
// };

// exports.shedule = {
//   startMessage: '<b>График работы:</b>',
//   content: '<i>Пн-Пт:</i> 16:00 - 00:30\n<i>Сб-Вс:</i> 10:00-00:30',
//   keyboard: [
//     [{ text: 'Назад', node: 'mainKeyboard' }]
//   ]
// };
exports.orderKeyboard = {
  waiting: true,
  startMessage: 'Детально опишите, что именно нужно купить, в каком количестве и где.\nДля удобства, оставьте номер своего мобильного телефона.\nНапишите заказ в сообщениях, после нажмите "Оформить заказ"',
  keyboard: [
    [{ text: 'Оформить заказ', node: null, content: 'order' }],
    [{ text: 'Назад', node: 'mainKeyboard' }]
  ],
  resize_keyboard: true
};

exports.feedback = {
  waiting: true,
  startMessage: 'Напишите отзыв о сервисе, качестве работы, о своих пожеланиях',
  keyboard: [
    [{ text: 'Назад', node: 'mainKeyboard' }]
  ],
  resize_keyboard: true
}

exports.mainKeyboard = {
  startMessage: '<b>Главное меню</b>',
  content: null,
  keyboard: [
    [{ text: 'Доставь мне...', node: 'orderKeyboard' }],
    [
      { text: 'О нас', node: null, content: 'about' },
      { text: 'Цены', node: null, content: 'photo' },
      { text: 'График работы', node: null, content: '<i>Пн-Пт:</i> 16:00 - 00:30\n<i>Сб-Вс:</i> 10:00-00:30' }
    ],
    [{ text: 'Написать отзыв', node: 'feedback' }]
    // [{ text: 'Оформить заказ', node: null, content: 'order' }]
  ]
};

// module.exports = { mainKeyboard, deliver, about, prices, shedule, pricePhoto };
// module.filename = 'keyb';
