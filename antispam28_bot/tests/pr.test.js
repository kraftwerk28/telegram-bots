'use strict';

// i tested how to use promises 'nd async/await :L

const pr = () => new Promise((res, rej) => {
  setTimeout(() => { res(123) }, 1000);
})

const kek = async () => {
  return await pr();
}

function lol() {
  kek().then((a) => {
    console.log('kek finished!', a);
  });
  
}

lol();
