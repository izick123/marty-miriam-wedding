import { createGalleryApi, formatDate } from "./gallery-api.js";
import { weddingConfig } from "./config.js";

const api = createGalleryApi();
const els = {
  login: document.querySelector("#admin-login"),
  loginForm: document.querySelector("#admin-login-form"),
  password: document.querySelector("#admin-password"),
  loginStatus: document.querySelector("#login-status"),
  content: document.querySelector("#admin-content"),
  tools: document.querySelector("#admin-tools"),
  grid: document.querySelector("#admin-gallery-grid"),
  status: document.querySelector("#admin-status"),
  refresh: document.querySelector("#refresh-photos"),
  exportJson: document.querySelector("#export-json"),
  template: document.querySelector("#admin-photo-template")
};

let photos = [];

init();

async function init() {
  els.loginForm.addEventListener("submit", unlockAdmin);
  els.refresh.addEventListener("click", loadAndRender);
  els.exportJson.addEventListener("click", exportPhotoList);

  if (sessionStorage.getItem("wedding-admin-unlocked") === "true") {
    showAdmin();
    await loadAndRender();
  }
}

async function unlockAdmin(event) {
  event.preventDefault();
  const password = els.password.value.trim();

  if (password !== weddingConfig.adminPassword) {
    els.loginStatus.textContent = "Wrong password.";
    return;
  }

  sessionStorage.setItem("wedding-admin-unlocked", "true");
  showAdmin();
  await loadAndRender();
}

function showAdmin() {
  els.login.hidden = true;
  els.content.hidden = false;
  els.tools.hidden = false;
}

async function loadAndRender() {
  setStatus("Loading photos...");
  try {
    await api.connect();
    photos = await api.loadPhotos();
    render();
    setStatus(`${photos.length} photo${photos.length === 1 ? "" : "s"} loaded.`);
  } catch (error) {
    console.error(error);
    setStatus("Could not load photos. Check Supabase setup.");
  }
}

function render() {
  els.grid.replaceChildren();

  photos.forEach((photo) => {
    const item = els.template.content.cloneNode(true);
    const img = item.querySelector("img");
    const name = item.querySelector("strong");
    const note = item.querySelector("span");
    const download = item.querySelector("a");
    const deleteButton = item.querySelector("button");

    img.src = photo.image_url;
    img.alt = photo.note ? `Wedding photo: ${photo.note}` : "Wedding guest photo";
    name.textContent = photo.guest_name || "Wedding guest";
    note.textContent = photo.note || formatDate(photo.created_at);
    download.href = photo.image_url;
    download.download = suggestedFilename(photo);
    deleteButton.addEventListener("click", () => deletePhoto(photo));
    els.grid.append(item);
  });
}

async function deletePhoto(photo) {
  const confirmed = window.confirm("Delete this photo from the live gallery?");
  if (!confirmed) return;

  setStatus("Deleting photo...");
  try {
    await api.deletePhoto(photo);
    photos = photos.filter((item) => item.id !== photo.id);
    render();
    setStatus("Photo deleted.");
  } catch (error) {
    console.error(error);
    setStatus("Delete failed. Check Supabase policies or delete it from the Supabase dashboard.");
  }
}

function exportPhotoList() {
  const blob = new Blob([JSON.stringify(photos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "marty-miriam-wedding-photos.json";
  link.click();
  URL.revokeObjectURL(url);
}

function suggestedFilename(photo) {
  const safeName = (photo.guest_name || "guest").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `marty-miriam-${safeName}-${photo.id}.jpg`;
}

function setStatus(message) {
  els.status.textContent = message;
}
