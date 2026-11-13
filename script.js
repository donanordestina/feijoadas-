const CONFIG = {
  whatsappPrimary: "5584987176550",
  whatsappSecondary: "5584994527534",
  storeName: "A Dona Sertaneja",
  deliveryFee: 5.0,
};

const form = document.getElementById("order-form");
const qtyInput = document.getElementById("quantity");
const qtyMinus = document.getElementById("qty-minus");
const qtyPlus = document.getElementById("qty-plus");
const addressField = document.getElementById("address-field");
const summaryDetails = document.getElementById("summary-details");
const summaryTotal = document.getElementById("summary-total");

function formatBRL(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function buildWhatsAppUrl(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Links diretos para contato rápido
const quickGreeting = `Olá! Vim pelo cardápio online da ${CONFIG.storeName} e gostaria de fazer um pedido de feijoada.`;
["header-wa-link", "hero-wa-link", "float-wa-link", "footer-wa-1"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.href = buildWhatsAppUrl(CONFIG.whatsappPrimary, quickGreeting);
});

const footerWa2 = document.getElementById("footer-wa-2");
if (footerWa2) {
  footerWa2.href = buildWhatsAppUrl(CONFIG.whatsappSecondary, quickGreeting);
}

function getOrderState() {
  const selectedSize = form.querySelector('input[name="size"]:checked');
  const sizeName = selectedSize ? selectedSize.value : "Porção Casal";
  const sizePrice = selectedSize ? parseFloat(selectedSize.dataset.price) : 33.0;
  const quantity = Math.max(1, parseInt(qtyInput.value, 10) || 1);

  const allSides = Array.from(form.querySelectorAll('input[name="side"]'));
  const selectedSides = allSides.filter((el) => el.checked).map((el) => el.value);
  const removedSides = allSides.filter((el) => !el.checked).map((el) => el.value);

  const selectedExtras = Array.from(form.querySelectorAll('input[name="extra"]:checked')).map((el) => ({
    name: el.value,
    price: parseFloat(el.dataset.price),
  }));

  const deliveryType = form.querySelector('input[name="deliveryType"]:checked')?.value || "Entrega";
  const customerName = document.getElementById("customer-name").value.trim();
  const customerAddress = document.getElementById("customer-address").value.trim();
  const paymentMethod = document.getElementById("payment-method").value;
  const waTarget = document.getElementById("wa-target").value || CONFIG.whatsappPrimary;
  const orderNotes = document.getElementById("order-notes").value.trim();

  const extrasTotal = selectedExtras.reduce((sum, item) => sum + item.price, 0);
  const deliveryFee = deliveryType === "Entrega" ? CONFIG.deliveryFee : 0;
  const total = sizePrice * quantity + extrasTotal + deliveryFee;

  return {
    sizeName,
    sizePrice,
    quantity,
    selectedSides,
    removedSides,
    selectedExtras,
    deliveryType,
    deliveryFee,
    customerName,
    customerAddress,
    paymentMethod,
    waTarget,
    orderNotes,
    total,
  };
}

function updateSummary() {
  const state = getOrderState();

  addressField.classList.toggle("hidden", state.deliveryType !== "Entrega");

  const lines = [
    `<div><strong>Porção:</strong> ${state.quantity}x ${state.sizeName}</div>`,
    `<div><strong>Acompanhamentos:</strong> ${
      state.removedSides.length === 0
        ? "Completa (todos inclusos)"
        : state.selectedSides.length > 0
          ? `${state.selectedSides.join(", ")} (sem: ${state.removedSides.join(", ")})`
          : "Nenhum acompanhamento"
    }</div>`,
  ];

  if (state.selectedExtras.length > 0) {
    lines.push(
      `<div><strong>Extras:</strong> ${state.selectedExtras.map((e) => e.name).join(", ")}</div>`
    );
  }

  lines.push(
    `<div><strong>Recebimento:</strong> ${state.deliveryType}${
      state.deliveryFee > 0 ? ` (+ ${formatBRL(state.deliveryFee)})` : ""
    }</div>`
  );
  lines.push(`<div><strong>Pagamento:</strong> ${state.paymentMethod}</div>`);

  summaryDetails.innerHTML = lines.join("");
  summaryTotal.textContent = formatBRL(state.total);
}

qtyMinus.addEventListener("click", () => {
  const current = parseInt(qtyInput.value, 10) || 1;
  if (current > 1) {
    qtyInput.value = current - 1;
    updateSummary();
  }
});

qtyPlus.addEventListener("click", () => {
  const current = parseInt(qtyInput.value, 10) || 1;
  if (current < 20) {
    qtyInput.value = current + 1;
    updateSummary();
  }
});

form.addEventListener("change", updateSummary);
form.addEventListener("input", updateSummary);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const state = getOrderState();

  const messageLines = [
    `🍲 *NOVO PEDIDO — ${CONFIG.storeName}*`,
    "",
    `*Item:* ${state.quantity}x ${state.sizeName} (${formatBRL(state.sizePrice * state.quantity)})`,
    `*Acompanhamentos:* ${
      state.removedSides.length === 0
        ? "Completa"
        : `Sem ${state.removedSides.join(", ")}`
    }`,
  ];

  if (state.selectedExtras.length > 0) {
    messageLines.push(
      `*Porções Extras:* ${state.selectedExtras.map((e) => `${e.name} (${formatBRL(e.price)})`).join(", ")}`
    );
  }

  messageLines.push(
    "",
    `*Tipo:* ${state.deliveryType}${
      state.deliveryFee > 0 ? ` (Taxa: ${formatBRL(state.deliveryFee)})` : ""
    }`,
    `*Pagamento:* ${state.paymentMethod}`
  );

  if (state.customerName) {
    messageLines.push(`*Nome:* ${state.customerName}`);
  }
  if (state.deliveryType === "Entrega" && state.customerAddress) {
    messageLines.push(`*Endereço:* ${state.customerAddress}`);
  }
  if (state.orderNotes) {
    messageLines.push(`*Observações:* ${state.orderNotes}`);
  }

  messageLines.push("", `*Total estimado:* ${formatBRL(state.total)}`);

  const url = buildWhatsAppUrl(state.waTarget, messageLines.join("\n"));
  window.open(url, "_blank", "noopener,noreferrer");
});

updateSummary();
