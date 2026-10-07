const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#mobile-menu');
function closeMenu(returnFocus = false) {
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  menu.hidden = !open;
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) closeMenu(true); });
matchMedia('(min-width: 601px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
const services = {
  polish: ['Полировка кузова', 'Работа с мелкими царапинами и следами эксплуатации. Возвращаем поверхности глубину цвета и выразительный блеск.'],
  protect: ['Защитное покрытие', 'Дополнительный уход за поверхностью кузова. Состав покрытия подбирается после осмотра и обсуждения условий эксплуатации.'],
  interior: ['Уход за салоном', 'Очистка поверхностей и уход за материалами салона. Объём работ подбирается под их состояние и особенности.'],
};
const serviceDetails = {
  polish: { image: 'assets/polish.webp', alt: 'Отражение студийного света на полированном кузове', scope: ['Осмотр состояния поверхности', 'Подбор состава работ', 'Полировка и проверка результата'], caption: 'Красота в каждом отражении' },
  protect: { image: 'assets/protect.webp', alt: 'Нанесение покрытия на кузов мягким аппликатором', scope: ['Осмотр и подготовка поверхности', 'Выбор подходящего покрытия', 'Нанесение и рекомендации по уходу'], caption: 'Внимание к каждой поверхности' },
  interior: { image: 'assets/interior.webp', alt: 'Кожаное сиденье и детали чистого автомобильного салона', scope: ['Оценка состояния материалов', 'Выбор способа очистки', 'Уход за поверхностями салона'], caption: 'Комфорт начинается с деталей' },
};
const tabs = [...document.querySelectorAll('[role="tab"]')];
const careChoices = [...document.querySelectorAll('[data-care]')];
const serviceExpectations = {
  polish: { fit: 'Если после мойки остаются мелкие царапины и тусклые отражения.', limit: 'Глубокие повреждения и сколы могут потребовать ремонта. Возможности полировки зависят от состояния покрытия.' },
  protect: { fit: 'Если хотите обсудить защиту поверхности и сделать дальнейший уход проще.', limit: 'Покрытие не исправляет повреждения кузова и не заменяет антигравийную плёнку. Подготовка поверхности обсуждается отдельно.' },
  interior: { fit: 'Если обычной уборки недостаточно и нужен уход за обивкой и отделкой.', limit: 'Износ, разрывы и повреждения материалов могут потребовать реставрации. Способ очистки подбирается после оценки.' },
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const servicePanel = document.querySelector('#service-panel');
const serviceImage = document.querySelector('#service-image');
const imageCache = new Map();
let selectionVersion = 0;
let displayedTab = tabs[0];
let outgoingImage = null;
let imageAnimation = null;
function finishImageTransition() {
  imageAnimation?.cancel();
  imageAnimation = null;
  outgoingImage?.remove();
  outgoingImage = null;
}
reducedMotion.addEventListener('change', event => { if (event.matches) finishImageTransition(); });
function loadServiceImage(src) {
  if (!imageCache.has(src)) {
    const image = new Image();
    image.src = src;
    imageCache.set(src, image.decode().catch(error => { imageCache.delete(src); throw error; }));
  }
  return imageCache.get(src);
}
function markSelectedTab(tab) {
  tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; });
  careChoices.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.care === tab.dataset.service)));
}
async function selectService(tab) {
  const version = ++selectionVersion;
  markSelectedTab(tab);
  servicePanel.setAttribute('aria-busy', 'true');
  const detail = serviceDetails[tab.dataset.service];
  try { await loadServiceImage(detail.image); }
  catch {
    if (version !== selectionVersion) return;
    markSelectedTab(displayedTab);
    servicePanel.removeAttribute('aria-busy');
    document.querySelector('#service-image-status').textContent = 'Фото не загрузилось. Выберите услугу ещё раз.';
    return;
  }
  if (version !== selectionVersion) return;
  finishImageTransition();
  if (displayedTab !== tab && !reducedMotion.matches && serviceImage.complete && serviceImage.naturalWidth) {
    outgoingImage = serviceImage.cloneNode();
    outgoingImage.removeAttribute('id');
    outgoingImage.alt = '';
    outgoingImage.setAttribute('aria-hidden', 'true');
    outgoingImage.className = 'service-image-outgoing';
    serviceImage.after(outgoingImage);
  }
  serviceImage.src = detail.image;
  serviceImage.alt = detail.alt;
  if (outgoingImage) {
    const oldImage = outgoingImage;
    imageAnimation = oldImage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    imageAnimation.finished.then(() => { if (outgoingImage === oldImage) finishImageTransition(); }).catch(() => {});
  }
  displayedTab = tab;
  servicePanel.setAttribute('aria-labelledby', tab.id);
  servicePanel.removeAttribute('aria-busy');
  document.querySelector('#service-image-status').textContent = '';
  const [title, description] = services[tab.dataset.service];
  document.querySelector('#service-title').textContent = title;
  document.querySelector('#service-description').textContent = description;
  document.querySelector('#service-fit').textContent = serviceExpectations[tab.dataset.service].fit;
  document.querySelector('#service-limit').textContent = serviceExpectations[tab.dataset.service].limit;
  document.querySelector('.service-visual span').textContent = detail.caption;
  document.querySelector('#service-scope').replaceChildren(...detail.scope.map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
  document.querySelector('#request-service').value = tab.dataset.service;
  document.querySelector('#request-result').hidden = true;
  document.querySelector('#form-status').textContent = '';
  document.querySelector('#copy-status').textContent = '';
}
tabs.forEach((tab, index) => {
  // Arrow keys keep the task picker and the selected direction in sync.
  tab.addEventListener('click', () => selectService(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectService(tabs[next]); tabs[next].focus(); }
  });
});
const comparison = document.querySelector('.comparison');
careChoices.forEach(choice => choice.addEventListener('click', () => selectService(tabs.find(tab => tab.dataset.service === choice.dataset.care))));
const slider = document.querySelector('#comparison-slider');
function updateComparison() {
  comparison.style.setProperty('--split', `${slider.value}%`);
  slider.setAttribute('aria-valuetext', `${slider.value}% изображения до полировки`);
}
slider.addEventListener('input', updateComparison);
updateComparison();
const requestForm = document.querySelector('#request-form');
const result = document.querySelector('#request-result');
const requestText = document.querySelector('#request-text');
const formStatus = document.querySelector('#form-status');
const copyStatus = document.querySelector('#copy-status');
requestForm.addEventListener('submit', event => {
  event.preventDefault();
  const nameInput = document.querySelector('#client-name');
  const carInput = document.querySelector('#car-model');
  const name = nameInput.value.trim();
  const car = carInput.value.trim();
  if (!name || !car) { formStatus.textContent = 'Укажите имя и модель автомобиля — поля не должны состоять из пробелов.'; (!name ? nameInput : carInput).focus(); result.hidden = true; return; }
  const select = document.querySelector('#request-service');
  const goal = document.querySelector('#client-goal').value.trim();
  requestText.value = `Здравствуйте! Меня зовут ${name}.\nАвтомобиль: ${car}.\nИнтересует: ${select.options[select.selectedIndex].text}.${goal ? `\nПожелания: ${goal}` : ''}\nХочу обсудить состав работ, стоимость и срок.`;
  result.hidden = false;
  formStatus.textContent = 'Текст подготовлен. Обращение не отправлено.';
  copyStatus.textContent = '';
  requestText.focus();
});
requestForm.addEventListener('input', event => {
  if (event.target === requestText) return;
  result.hidden = true;
  formStatus.textContent = '';
  copyStatus.textContent = '';
});
document.querySelector('#copy-request').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(requestText.value);
    copyStatus.textContent = 'Текст скопирован.';
  } catch {
    requestText.focus(); requestText.select();
    copyStatus.textContent = 'Выделили текст. Скопируйте его вручную.';
  }
});
