import { compressImage, createGalleryApi, formatDate } from "./gallery-api.js";

const api = createGalleryApi();

const els = {
  form: document.querySelector("#upload-form"),
  fileInput: document.querySelector("#photo-files"),
  fileStatus: document.querySelector("#file-status"),
  status: document.querySelector("#form-status"),
  gallery: document.querySelector("#gallery-grid"),
  empty: document.querySelector("#empty-state"),
  template: document.querySelector("#photo-template")
};

const channel = "BroadcastChannel" in window ? new BroadcastChannel("wedding-gallery") : null;
let photos = [];

init();

async function init() {
  await api.connect();
  photos = await api.loadPhotos();
  renderGallery();
  setupRealtime();
  setupUploadForm();
}

function setupRealtime() {
  api.subscribe((photo) => {
    photos = [photo, ...photos.filter((item) => item.id !== photo.id)];
    renderGallery();
  });

  channel?.addEventListener("message", async (event) => {
    if (event.data?.type === "photo-added") {
      photos = await api.loadPhotos();
      renderGallery();
    }
  });
}

function setupUploadForm() {
  els.fileInput.addEventListener("change", () => {
    const files = Array.from(els.fileInput.files || []);
    els.fileStatus.textContent = files.length
      ? `${files.length} photo${files.length === 1 ? "" : "s"} selected: ${files.map((file) => file.name).join(", ")}`
      : "No photos selected yet.";
    setStatus("");
  });

  els.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(els.fileInput.files || []);

    if (!files.length) {
      setStatus("Choose at least one photo first.");
      return;
    }

    const guestName = document.querySelector("#guest-name").value.trim() || "Wedding guest";
    const note = document.querySelector("#photo-note").value.trim();
    setStatus(`Uploading ${files.length} photo${files.length === 1 ? "" : "s"}...`);

    try {
      const uploaded = [];

      for (const file of files) {
        const compressed = await compressImage(file).catch(() => file);
        const record = await api.uploadPhoto(compressed, guestName, note);
        uploaded.push(record);
      }

      const uploadedIds = new Set(uploaded.map((photo) => photo.id));
      photos = [...uploaded.reverse(), ...photos.filter((photo) => !uploadedIds.has(photo.id))];
      els.form.reset();
      els.fileStatus.textContent = "No photos selected yet.";
      renderGallery();
      setStatus(`${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} uploaded. Thank you!`);
      channel?.postMessage({ type: "photo-added" });
    } catch (error) {
      console.error(error);
      setStatus("Upload failed. Try one photo at a time or ask for help.");
    }
  });
}

function renderGallery() {
  els.gallery.replaceChildren();
  els.empty.hidden = photos.length > 0;

  photos.forEach((photo) => {
    const item = els.template.content.cloneNode(true);
    const img = item.querySelector("img");
    const name = item.querySelector("strong");
    const note = item.querySelector("span");
    const download = item.querySelector("a");

    img.src = photo.image_url;
    img.alt = photo.note ? `Wedding photo: ${photo.note}` : "Wedding guest photo";
    name.textContent = photo.guest_name || "Wedding guest";
    note.textContent = photo.note || formatDate(photo.created_at);
    download.href = photo.image_url;
    download.download = suggestedFilename(photo);
    els.gallery.append(item);
  });
}

function suggestedFilename(photo) {
  const safeName = (photo.guest_name || "guest").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `marty-miriam-${safeName}-${photo.id}.jpg`;
}

function setStatus(message) {
  els.status.textContent = message;
}
