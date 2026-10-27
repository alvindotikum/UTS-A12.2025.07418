/* =========================================================
   GARASI 27 - INTERAKSI LANDING PAGE
   JavaScript murni / vanilla JS (tanpa framework atau API).

   CARA MENGAKTIFKAN TOMBOL WHATSAPP:
   Isi nomor bengkel sebenarnya pada variabel di bawah ini,
   format internasional: 6281234567890 (tanpa + / spasi).
   Jika masih kosong, pengunjung tetap bisa salin ringkasan.
   ========================================================= */
const NOMOR_WHATSAPP_BENGKEL = "";

// 1. Menu navigasi mobile
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
const header = document.querySelector(".site-header");

function closeMenu() {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Buka menu navigasi");
}

menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
});
navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
document.addEventListener("click", (event) => {
  if (!header.contains(event.target)) closeMenu();
});
window.addEventListener("resize", () => { if (window.innerWidth > 860) closeMenu(); });
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 8), { passive: true });

// 2. Filter layanan menggunakan DOM, bukan reload halaman
const filterButtons = document.querySelectorAll(".filter-btn");
const serviceCards = document.querySelectorAll(".service-card");
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    serviceCards.forEach((card) => {
      card.hidden = category !== "semua" && card.dataset.category !== category;
    });
  });
});

// 3. Sinkronisasi pilih layanan dengan formulir booking
const serviceCheckboxes = Array.from(document.querySelectorAll('input[name="layanan"]'));
const countOutput = document.getElementById("service-count");
const selectedList = document.getElementById("selected-list");
const dateInput = document.getElementById("tanggal");
const datePreview = document.getElementById("date-preview");
const pickButtons = document.querySelectorAll(".service-action");

function selectedServices() {
  return serviceCheckboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
}
function readableDate(dateValue) {
  if (!dateValue) return "Belum dipilih";
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return "Belum dipilih";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}
function updateSummary() {
  const services = selectedServices();
  countOutput.textContent = `${services.length} layanan`;
  selectedList.replaceChildren();
  if (!services.length) {
    const li = document.createElement("li");
    li.textContent = "Belum ada layanan dipilih.";
    selectedList.append(li);
  } else {
    services.forEach((service) => {
      const li = document.createElement("li");
      li.textContent = service;
      selectedList.append(li);
    });
  }
  datePreview.textContent = readableDate(dateInput.value);
  pickButtons.forEach((button) => {
    const isPicked = services.includes(button.dataset.pick);
    button.classList.toggle("picked", isPicked);
    button.firstChild.textContent = isPicked ? "Terpilih " : "Pilih layanan ";
    button.setAttribute("aria-pressed", String(isPicked));
  });
  if (services.length) document.getElementById("error-layanan").textContent = "";
}
serviceCheckboxes.forEach((checkbox) => checkbox.addEventListener("change", updateSummary));
dateInput.addEventListener("input", updateSummary);
pickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetCheckbox = serviceCheckboxes.find((checkbox) => checkbox.value === button.dataset.pick);
    if (targetCheckbox) {
      targetCheckbox.checked = !targetCheckbox.checked;
      updateSummary();
      showToast(targetCheckbox.checked ? "Layanan ditambahkan ke rencana servis." : "Layanan dihapus dari rencana servis.");
      document.getElementById("booking").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
dateInput.min = todayLocal();
updateSummary();

// 4. Validasi form dan ringkasan booking
const form = document.getElementById("booking-form");
const dialog = document.getElementById("result-dialog");
const resultText = document.getElementById("result-text");
const dialogHint = document.getElementById("dialog-hint");
const fieldIds = ["nama", "telepon", "kendaraan", "tanggal"];
let lastSummary = "";

function fieldError(id, message) {
  const input = document.getElementById(id);
  const error = document.getElementById(`error-${id}`);
  error.textContent = message;
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}
function validate() {
  fieldIds.forEach((id) => fieldError(id, ""));
  document.getElementById("error-layanan").textContent = "";
  let valid = true;
  const nama = document.getElementById("nama").value.trim();
  const telepon = document.getElementById("telepon").value.trim().replace(/[\s-]/g, "");
  const kendaraan = document.getElementById("kendaraan").value;
  const tanggal = dateInput.value;

  if (nama.length < 2) { fieldError("nama", "Isi nama minimal 2 karakter."); valid = false; }
  if (!/^(?:0|62|\+62)[0-9]{8,13}$/.test(telepon)) { fieldError("telepon", "Masukkan nomor WhatsApp yang valid."); valid = false; }
  if (!kendaraan) { fieldError("kendaraan", "Pilih jenis kendaraan."); valid = false; }
  if (!tanggal || tanggal < todayLocal()) { fieldError("tanggal", "Pilih hari ini atau tanggal mendatang."); valid = false; }
  if (!selectedServices().length) { document.getElementById("error-layanan").textContent = "Pilih minimal satu layanan."; valid = false; }
  return valid;
}

fieldIds.forEach((id) => document.getElementById(id).addEventListener("input", () => fieldError(id, "")));
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) {
    showToast("Periksa kembali kolom yang ditandai.");
    const invalidField = form.querySelector('[aria-invalid="true"]');
    (invalidField || document.getElementById("error-layanan")).scrollIntoView({ behavior: "smooth", block: "center" });
    invalidField?.focus({ preventScroll: true });
    return;
  }

  const name = document.getElementById("nama").value.trim();
  const phone = document.getElementById("telepon").value.trim();
  const vehicle = document.getElementById("kendaraan").value;
  const complaint = document.getElementById("keluhan").value.trim();
  const list = selectedServices().map((service, index) => `${index + 1}. ${service}`).join("\n");
  lastSummary = [
    "RENCANA SERVIS KENDARAAN — GARASI 27",
    "------------------------------------",
    `Nama: ${name}`,
    `WhatsApp: ${phone}`,
    `Kendaraan: ${vehicle}`,
    `Tanggal pilihan: ${readableDate(dateInput.value)}`,
    "",
    "LAYANAN YANG DIMINTA:",
    list,
    "",
    `Keluhan: ${complaint || "Belum ada keterangan tambahan."}`,
    "",
    "Catatan: Ini baru permintaan. Jadwal dan biaya perlu dikonfirmasi bengkel."
  ].join("\n");
  resultText.textContent = lastSummary;
  const hasValidWhatsApp = /^62\d{9,14}$/.test(NOMOR_WHATSAPP_BENGKEL);
  dialogHint.textContent = hasValidWhatsApp
    ? "Tombol WhatsApp membuka chat dengan pesan siap kirim; pengiriman harus Anda konfirmasi di WhatsApp."
    : "Nomor WhatsApp bengkel belum diatur di script.js. Gunakan tombol Salin Ringkasan.";
  dialog.showModal();
});

// 5. Tindakan modal dan clipboard
const closeDialog = document.getElementById("close-dialog");
closeDialog.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback agar tetap berfungsi ketika index.html dibuka langsung (file://).
      const temporary = document.createElement("textarea");
      temporary.value = text;
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.append(temporary);
      temporary.select();
      const copied = document.execCommand("copy");
      temporary.remove();
      if (!copied) throw new Error("Clipboard tidak tersedia");
    }
    showToast("Ringkasan berhasil disalin.");
  } catch {
    resultText.focus();
    showToast("Gagal menyalin otomatis. Silakan blok dan salin teks ringkasan.");
  }
}

document.getElementById("copy-summary").addEventListener("click", () => {
  if (lastSummary) copyText(lastSummary);
});
document.getElementById("whatsapp-summary").addEventListener("click", () => {
  if (!/^62\d{9,14}$/.test(NOMOR_WHATSAPP_BENGKEL)) {
    showToast("Isi nomor WhatsApp bengkel asli di script.js terlebih dahulu.");
    return;
  }
  if (!lastSummary) return;
  const url = `https://wa.me/${NOMOR_WHATSAPP_BENGKEL}?text=${encodeURIComponent(lastSummary)}`;
  window.open(url, "_blank", "noopener,noreferrer");
});

// 6. Notifikasi singkat, FAQ, tahun footer
let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}
const faqItems = document.querySelectorAll(".faq-list details");
faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) faqItems.forEach((other) => { if (other !== item) other.open = false; });
  });
});
document.getElementById("year").textContent = String(new Date().getFullYear());
