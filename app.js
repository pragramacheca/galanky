const PRODUCTS = [
  { id: 'fluy-park', name: 'Fluy Park', subtitle: 'Alça Rígida // Acabamento Metálico', price: 2000, image: 'bag01.png' },
  { id: 'elegant-pure-dark', name: 'Elegant Pure Dark', subtitle: 'Corrente de Metal // Acabamento Plissado', price: 2000, image: 'bag02.jpg' },
  { id: 'cube-pure-black', name: 'Cube Pure Black', subtitle: 'Formato Origami // Detalhe Metálico', price: 3000, image: 'bag03.png' },
  { id: 'ultra-purple', name: 'Ultra Purple', subtitle: 'Detalhes em Cristais // Fecho Central', price: 4000, image: 'bag04.jpg' },
  { id: 'ultra-black', name: 'Ultra Black', subtitle: 'Estrutura Rígida // Acabamento Fosco', price: 4000, image: 'bag05.jpg' }
];

const ASSET_PREFIX = location.pathname.includes('/pags/') ? './assets/' : './pags/assets/';
const CART_KEY = 'galanky_cart_v1';
const ORDER_KEY = 'galanky_order_v1';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
function money(value) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function getProduct(id) { return PRODUCTS.find(p => p.id === id); }

function addToCart(id) {
  const product = getProduct(id); if (!product) return;
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty += 1; else cart.push({ id, qty: 1 });
  saveCart(cart);
  showToast(`${product.name} adicionado ao carrinho.`);
}

function updateCartCount() {
  const count = getCart().reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = count);
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function renderCart() {
  const target = document.querySelector('[data-cart-list]'); if (!target) return;
  const cart = getCart();
  if (!cart.length) {
    target.innerHTML = '<div class="empty-state"><span>Seu carrinho está vazio.</span><a class="btn" href="./product.html">Explorar coleção</a></div>';
    document.querySelector('[data-cart-total]').textContent = money(0);
    return;
  }
  let total = 0;
  target.innerHTML = cart.map(item => {
    const p = getProduct(item.id); const subtotal = p.price * item.qty; total += subtotal;
    return `<article class="cart-item">
      <img src="${ASSET_PREFIX}${p.image}" alt="${p.name}">
      <div class="cart-item-info"><h3>${p.name}</h3><p>${money(p.price)} cada</p>
      <div class="qty-control"><button type="button" data-action="minus" data-id="${p.id}">−</button><strong>${item.qty}</strong><button type="button" data-action="plus" data-id="${p.id}">+</button></div></div>
      <strong>${money(subtotal)}</strong><button class="remove-item" type="button" data-action="remove" data-id="${p.id}" aria-label="Remover">×</button>
    </article>`;
  }).join('');
  document.querySelector('[data-cart-total]').textContent = money(total);
}

function cartAction(action, id) {
  let cart = getCart(); const item = cart.find(i => i.id === id); if (!item) return;
  if (action === 'plus') item.qty++;
  if (action === 'minus') item.qty--;
  if (action === 'remove' || item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart(cart); renderCart();
}

function setupProductButtons() {
  document.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => addToCart(btn.dataset.add)));
}

const NEARBY_STATES = ['RJ', 'MG', 'PR', 'MS'];
async function lookupCep(raw) {
  const cep = raw.replace(/\D/g, '');
  if (cep.length !== 8) throw new Error('Digite um CEP válido com 8 números.');
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) throw new Error('Não foi possível consultar o CEP agora.');
  const data = await response.json();
  if (data.erro) throw new Error('CEP não encontrado.');
  return data;
}

function deliveryInfo(uf) {
  if (uf === 'SP') return { days: 5, region: 'São Paulo', label: 'São Paulo (SP)' };
  if (NEARBY_STATES.includes(uf)) return { days: 7, region: 'Estados próximos', label: `${uf} — região próxima de São Paulo` };
  return { days: 21, region: 'Demais estados', label: `${uf} — demais regiões` };
}

function addBusinessDays(startDate, days) {
  const d = new Date(startDate); let remaining = days;
  while (remaining > 0) { d.setDate(d.getDate() + 1); const day = d.getDay(); if (day !== 0 && day !== 6) remaining--; }
  return d;
}
function formatDate(date) { return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
function daysLeft(target) { return Math.max(0, Math.ceil((new Date(target).getTime() - Date.now()) / 86400000)); }

async function calculateDelivery() {
  const input = document.querySelector('#cep'); const result = document.querySelector('#delivery-result');
  if (!input || !result) return;
  result.classList.remove('is-error'); result.innerHTML = '<span class="loading-line">Consultando CEP...</span>';
  try {
    const data = await lookupCep(input.value); const info = deliveryInfo(data.uf);
    const inspection = '1–2 dias';
    result.innerHTML = `<div class="delivery-success"><div><span class="eyebrow">Localização confirmada</span><strong>${data.localidade} — ${data.uf}</strong></div>
      <div class="delivery-metrics"><div><small>Transporte</small><strong>${info.days} dias</strong></div><div><small>Vistoria</small><strong>${inspection}</strong></div><div><small>Prazo demonstrativo</small><strong>${info.days + 1}–${info.days + 2} dias úteis</strong></div></div>
      <p>O prazo acima é uma simulação criada para o projeto escolar. A vistoria de qualidade acontece antes do envio.</p></div>`;
    document.querySelector('#checkout-cep').value = input.value;
    document.querySelector('#checkout-location').value = `${data.localidade} — ${data.uf}`;
    window.__delivery = { ...info, city: data.localidade, uf: data.uf, cep: input.value.replace(/\D/g,'') };
    return window.__delivery;
  } catch (error) {
    result.classList.add('is-error'); result.textContent = error.message;
  }
}

function checkoutSummary() {
  const list = document.querySelector('[data-checkout-items]'); if (!list) return;
  const cart = getCart(); let total = 0;
  list.innerHTML = cart.map(item => { const p = getProduct(item.id); const subtotal = p.price * item.qty; total += subtotal; return `<div><span>${p.name} × ${item.qty}</span><strong>${money(subtotal)}</strong></div>`; }).join('');
  document.querySelector('[data-checkout-total]').textContent = money(total);
}

function generateOrder() {
  const cart = getCart(); if (!cart.length) { showToast('Adicione um produto ao carrinho primeiro.'); return; }
  const form = document.querySelector('#checkout-form');
  if (!form || !form.reportValidity()) return;
  const delivery = window.__delivery;
  if (!delivery) { showToast('Consulte seu CEP antes de finalizar.'); return; }
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'pix';
  const installments = payment === 'credit' ? Number(document.querySelector('#installments')?.value || 1) : 1;
  const total = cart.reduce((sum, item) => { const p = getProduct(item.id); return sum + (p ? p.price * item.qty : 0); }, 0);
  const installmentValue = total / installments;
  const now = new Date();
  const inspectionDays = 2;
  const ready = new Date(now); ready.setDate(ready.getDate() + inspectionDays);
  const dispatch = new Date(now); dispatch.setDate(dispatch.getDate() + inspectionDays + 1);
  const eta = addBusinessDays(dispatch, delivery.days);
  const order = {
    code: `GAL-${Math.floor(1000 + Math.random()*9000)}`,
    createdAt: now.toISOString(),
    readyAt: ready.toISOString(),
    dispatchAt: dispatch.toISOString(),
    eta: eta.toISOString(),
    status: 'inspection',
    delivery,
    payment,
    installments,
    total,
    installmentValue,
    customer: Object.fromEntries(new FormData(form).entries()),
    cart
  };
  localStorage.setItem(ORDER_KEY, JSON.stringify(order)); localStorage.removeItem(CART_KEY); updateCartCount();
  window.location.href = './rastreio.html';
}

function trackingState(order) {
  const now = Date.now(), created = new Date(order.createdAt).getTime(), ready = new Date(order.readyAt).getTime(), dispatch = new Date(order.dispatchAt).getTime(), eta = new Date(order.eta).getTime();
  if (now >= eta) return { index: 4, label: 'Entregue', desc: 'Pedido entregue ao cliente.', left: 0 };
  if (now >= dispatch) return { index: 3, label: 'Produto a caminho', desc: 'Seu pedido foi aprovado e está em transporte.', left: daysLeft(order.eta) };
  if (now >= ready) return { index: 2, label: 'Pronto para envio', desc: 'A vistoria foi concluída e o pedido está pronto para sair do atelier.', left: daysLeft(order.eta) };
  if (now - created >= 60 * 1000) return { index: 1, label: 'Vistoria de qualidade', desc: 'Nossa equipe está conferindo acabamento e embalagem.', left: daysLeft(order.eta) };
  return { index: 0, label: 'Produto sendo preparado', desc: 'Seu pedido está sendo separado e preparado.', left: daysLeft(order.eta) };
}

function renderTracking() {
  const box = document.querySelector('[data-tracking]'); if (!box) return;
  let order; try { order = JSON.parse(localStorage.getItem(ORDER_KEY)); } catch { order = null; }
  if (!order) { box.innerHTML = '<div class="empty-state"><h2>Nenhum pedido encontrado</h2><p>Finalize uma compra demonstrativa para gerar um rastreio.</p><a class="btn" href="./product.html">Ir para a coleção</a></div>'; return; }
  const state = trackingState(order);
  const items = order.cart.map(i => { const p = getProduct(i.id); return `${p.name} × ${i.qty}`; }).join(' • ');
  const steps = ['Produto preparado', 'Vistoria de qualidade', 'Pronto para envio', 'Produto a caminho', 'Entregue'];
  box.innerHTML = `<div class="tracking-head"><div><span class="eyebrow">Pedido ${order.code}</span><h1>${state.label}</h1><p>${state.desc}</p></div><div class="tracking-count"><small>Previsão de entrega</small><strong>${state.left === 0 ? 'Hoje' : `Faltam ${state.left} dias`}</strong><span>${formatDate(new Date(order.eta))}</span></div></div>
    <div class="timeline timeline-five">${steps.map((step,i) => `<div class="timeline-step ${i <= state.index ? 'done' : ''} ${i === state.index ? 'current' : ''}"><span>${i < state.index ? '✓' : i+1}</span><strong>${step}</strong></div>`).join('')}</div>
    <div class="tracking-details"><div><small>Destino</small><strong>${order.delivery.city} — ${order.delivery.uf}</strong><span>CEP ${order.delivery.cep}</span></div><div><small>Itens</small><strong>${items}</strong><span>Pagamento demonstrativo: ${order.payment === 'credit' ? `Cartão de crédito — ${order.installments}x de ${money(order.installmentValue)}` : order.payment === 'debit' ? 'Cartão de débito — à vista' : 'PIX'}</span></div><div><small>Prazo</small><strong>${order.delivery.days} dias de transporte</strong><span>+ 1–2 dias de vistoria</span></div></div>`;
}

function getCartTotal() {
  return getCart().reduce((sum, item) => { const p = getProduct(item.id); return sum + (p ? p.price * item.qty : 0); }, 0);
}

function updateInstallmentResult() {
  const result = document.querySelector('#installment-result');
  const select = document.querySelector('#installments');
  if (!result || !select) return;
  const selected = document.querySelector('input[name="payment"]:checked')?.value;
  if (selected !== 'credit') { result.innerHTML = ''; return; }
  const total = getCartTotal();
  const installments = Number(select.value || 1);
  const value = total / installments;
  result.innerHTML = `<strong>${installments}x de ${money(value)}</strong><span>Total final: ${money(total)} <em>sem juros (simulação)</em></span>`;
}

function setupCheckout() {
  const form = document.querySelector('#checkout-form'); if (!form) return;
  checkoutSummary();
  const updatePaymentPanel = () => {
    const selected = document.querySelector('input[name="payment"]:checked')?.value || 'pix';
    document.querySelectorAll('.payment-panel').forEach(panel => panel.hidden = true);
    document.querySelector(`[data-payment-panel="${selected}"]`).hidden = false;
    updateInstallmentResult();
  };
  document.querySelectorAll('input[name="payment"]').forEach(input => input.addEventListener('change', updatePaymentPanel));
  document.querySelector('#installments')?.addEventListener('change', updateInstallmentResult);
  updatePaymentPanel();
  document.querySelector('#calculate-cep')?.addEventListener('click', calculateDelivery);
  document.querySelector('#cep')?.addEventListener('blur', calculateDelivery);
  form.addEventListener('submit', e => { e.preventDefault(); generateOrder(); });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount(); setupProductButtons(); renderCart(); setupCheckout(); renderTracking();
  document.querySelector('[data-cart-list]')?.addEventListener('click', e => { const btn = e.target.closest('[data-action]'); if (btn) cartAction(btn.dataset.action, btn.dataset.id); });
  document.querySelector('#cep')?.addEventListener('input', e => { let v = e.target.value.replace(/\D/g,'').slice(0,8); if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5); e.target.value = v; });
  setInterval(() => { if (document.querySelector('[data-tracking]')) renderTracking(); }, 60000);
});
