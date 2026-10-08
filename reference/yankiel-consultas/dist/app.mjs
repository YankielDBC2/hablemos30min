import { dateKey, addDays, sampleSlotsForDate, monthCells } from './calendar.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const now = Date.now();
const state = { zone: 'America/New_York', date: '', slot: null, month: 0, year: 0, step: 1, topic: '', details: null };
const timeFormat = instant => new Intl.DateTimeFormat('es', { timeZone: state.zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(instant);
const dateFormat = (instant, options) => new Intl.DateTimeFormat('es', { timeZone: state.zone, ...options }).format(instant);
const prettyDate = () => dateFormat(state.slot, { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = () => dateFormat(state.slot, { day: 'numeric', month: 'short' });
const zoneLabel = () => $('#timezone').selectedOptions[0].textContent;
const offsetLabel = (instant = state.slot ?? now) => new Intl.DateTimeFormat('en', {timeZone:state.zone,timeZoneName:'shortOffset'}).formatToParts(instant).find(p=>p.type==='timeZoneName').value;
const slotsCache = new Map();
function slotsForDate(key) {
  const cacheKey = `${state.zone}:${key}`;
  if (!slotsCache.has(cacheKey)) slotsCache.set(cacheKey, sampleSlotsForDate(key, state.zone, now));
  return slotsCache.get(cacheKey);
}

const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
if (viewerZone && ![...$('#timezone').options].some(option => option.value === viewerZone)) {
  const option = document.createElement('option');
  option.value = viewerZone; option.textContent = `Tu zona · ${viewerZone.replaceAll('_', ' ')}`;
  $('#timezone').append(option);
}
// Miami is explicit by default; timezone choices convert the same sample instants.
function initializeDate() {
  const start = dateKey(now, state.zone);
  for (let i = 1; i < 15; i++) {
    const key = addDays(start, i);
    if (slotsForDate(key).length) { state.date = key; break; }
  }
  [state.year, state.month] = state.date.split('-').slice(0, 2).map(Number);
  state.month -= 1;
}
function renderCalendar() {
  const today = dateKey(now, state.zone);
  $('#month-label').textContent = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(state.year, state.month, 1, 12)));
  const grid = $('#calendar-grid'); grid.replaceChildren();
  monthCells(state.year, state.month).forEach(key => {
    if (!key) { const spacer = document.createElement('span'); spacer.className = 'empty-day'; spacer.setAttribute('aria-hidden', 'true'); grid.append(spacer); return; }
    const button = document.createElement('button'); button.type = 'button';
    const enabled = slotsForDate(key).length > 0;
    button.className = `day-button${key === state.date ? ' selected' : ''}${key === today ? ' today' : ''}`;
    button.textContent = Number(key.slice(-2)); button.disabled = !enabled;
    button.setAttribute('aria-pressed', String(key === state.date));
    const fullDate = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
    button.setAttribute('aria-label', `${fullDate}${enabled ? ', horarios de muestra' : ', sin horarios'}`);
    button.addEventListener('click', () => { state.date = key; state.slot = null; renderCalendar(); renderTimes(); updateSelection(); const selected = grid.querySelector('.selected'); selected?.focus({preventScroll:true}); });
    grid.append(button);
  });
  const [startYear, startMonth] = today.split('-').map(Number);
  $('#previous-month').disabled = state.year * 12 + state.month <= startYear * 12 + startMonth - 1;
  const maxDay = addDays(today, 90);
  const [maxYear, maxMonth] = maxDay.split('-').map(Number);
  $('#next-month').disabled = state.year * 12 + state.month >= maxYear * 12 + maxMonth - 1;
}
function renderTimes() {
  $('#selected-day').textContent = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${state.date}T12:00:00Z`));
  const container = $('#time-slots'); container.replaceChildren();
  const slots = slotsForDate(state.date);
  slots.forEach(instant => {
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = timeFormat(instant); button.className = `time-button${state.slot === instant ? ' selected' : ''}`;
    button.setAttribute('aria-pressed', String(state.slot === instant));
    button.setAttribute('aria-label', `${timeFormat(instant)}, ${offsetLabel(instant)}, consulta de 30 minutos, horario de muestra`);
    button.addEventListener('click', () => { state.slot = instant; $$('#time-slots button').forEach(b=> { const active=b===button;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active)); }); updateSelection(); });
    container.append(button);
  });
  if (!slots.length) { const p = document.createElement('p'); p.className = 'empty-times'; p.textContent = 'Elige otro día para ver los horarios de muestra.'; container.append(p); }
}
function updateSelection() {
  $('#continue-details').disabled = state.slot === null;
  const hint = $('#selection-hint'); hint.replaceChildren();
  if (state.slot === null) { hint.append('Un pequeño espacio.',document.createElement('br')); const strong = document.createElement('strong'); strong.textContent = 'Una nueva perspectiva.'; hint.append(strong); }
  else {hint.append(shortDate(),document.createElement('br')); const strong = document.createElement('strong'); strong.textContent = `${timeFormat(state.slot)} · ${offsetLabel()}`; hint.append(strong);}
}
function changeMonth(amount) {
  const date = new Date(Date.UTC(state.year, state.month + amount, 1, 12));
  state.year = date.getUTCFullYear(); state.month = date.getUTCMonth(); renderCalendar();
}
function goToStep(step) {
  state.step = step;
  $$('.step-panel').forEach(panel => {panel.hidden = panel.id !== `step-${step}`;});
  $$('.steps li').forEach(li => {const number=Number(li.dataset.step);li.classList.toggle('active',number===step);li.classList.toggle('complete',number<step); if(number===step) li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
  if (step === 2) { $('#details-summary').textContent = `${prettyDate()} · ${timeFormat(state.slot)} · ${zoneLabel()} (${offsetLabel()})`; if (state.topic) $('#topic').value = state.topic; }
  if (step === 3) renderReview();
  const heading = $(`#step-${step} h3`);heading.tabIndex=-1;heading.focus({preventScroll:true});
  if (window.matchMedia('(max-width: 960px)').matches) $('#reservar').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderReview() {
  const list = $('#review-list'); list.replaceChildren();
  const rows = [['Cuándo', `${prettyDate()} · ${timeFormat(state.slot)}`],['Zona',`${zoneLabel()} (${offsetLabel()})`],['Nombre',state.details.name],['Email',state.details.email],['Tema',state.details.topic]];
  if (state.details.notes) rows.push(['Tu idea',state.details.notes]);
  rows.forEach(([label,value]) => {const row=document.createElement('div');const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=value;if(label==='Cuándo')dd.className='review-date';row.append(dt,dd);list.append(row);});
}
$('#previous-month').addEventListener('click', () => changeMonth(-1));
$('#next-month').addEventListener('click', () => changeMonth(1));
$('#timezone').addEventListener('change', event => {
  state.zone = event.target.value;
  if (state.slot !== null) { state.date = dateKey(state.slot, state.zone); [state.year,state.month]=state.date.split('-').slice(0,2).map(Number);state.month--; }
  else initializeDate();
  renderCalendar();renderTimes();updateSelection();
});
$('#continue-details').addEventListener('click', () => { if(state.slot !== null) goToStep(2); });
$$('[data-back]').forEach(button => button.addEventListener('click', () => goToStep(Number(button.dataset.back))));
$$('[data-topic]').forEach(button => button.addEventListener('click', () => { state.topic=button.dataset.topic;$('#topic').value=state.topic;$$('[data-topic]').forEach(chip=>{const selected=chip===button;chip.classList.toggle('selected',selected);chip.setAttribute('aria-pressed',String(selected));});if(state.details)state.details.topic=state.topic;if(state.step===3)renderReview(); }));
$('#topic').addEventListener('change', event => {state.topic=event.target.value;$$('[data-topic]').forEach(chip=>{const selected=chip.dataset.topic===state.topic;chip.classList.toggle('selected',selected);chip.setAttribute('aria-pressed',String(selected));});});
$('#details-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('#full-name');const email = $('#email');
  name.value = name.value.trim();email.value=email.value.trim();
  if (!event.currentTarget.reportValidity()) return;
  state.details={name:name.value,email:email.value,topic:$('#topic').value,notes:$('#project-notes').value.trim()};goToStep(3);
});
$('#checkout-button').addEventListener('click', () => $('#checkout-dialog').showModal());
$('#close-dialog').addEventListener('click', () => $('#checkout-dialog').close());
$('#return-to-review').addEventListener('click', () => $('#checkout-dialog').close());
$('#checkout-dialog').addEventListener('click',event => {if(event.target===$('#checkout-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();}});
$$('a[href="#reservar"]').forEach(link=>link.addEventListener('click',()=>{const card=$('.booking-card');card.classList.remove('highlight');requestAnimationFrame(()=>card.classList.add('highlight'));}));
$('#copyright-year').textContent = new Date().getFullYear();
$$('[data-topic]').forEach(chip=>chip.setAttribute('aria-pressed','false'));
initializeDate();renderCalendar();renderTimes();updateSelection();
$('.steps li.active').setAttribute('aria-current','step');
