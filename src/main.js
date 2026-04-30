import { weddingConfig } from "./config.js";

const els = {
  days: document.querySelector("#days-until"),
  form: document.querySelector("#upload-form"),
  fileInput: document.querySelector("#photo-files"),
  status: document.querySelector("#form-status"),
  gallery: document.querySelector("#gallery-grid"),
  empty: document.querySelector("#empty-state"),
  template: document.querySelector("#photo-template"),
  qrCanvas: document.querySelector("#qr-code"),
  qrUrl: document.querySelector("#qr-url")
};

const localKey = "marty-miriam-wedding-photos";
const channel = "BroadcastChannel" in window ? new BroadcastChannel("wedding-gallery") : null;
const uploadUrl = `${weddingConfig.deployedUrl || window.location.origin + window.location.pathname}#upload`;

let supabase = null;
let photos = [];

init();

async function init() {
  renderCountdown();
  setupExternalSiteLink();
  setInterval(renderCountdown, 60 * 60 * 1000);
  await connectSupabase();
  await loadPhotos();
  renderGallery();
  setupRealtime();
  setupUploadForm();
  setupQr();

  if (window.location.hash === "#upload") {
    document.querySelector("#upload")?.scrollIntoView({ behavior: "smooth" });
  }
}

function renderCountdown() {
  const then = new Date(weddingConfig.weddingDate);
  const now = new Date();
  const diff = Math.max(0, then - now);
  els.days.textContent = Math.ceil(diff / 86400000).toString();
}

function setupExternalSiteLink() {
  const link = document.querySelector("#external-site-link");
  if (!weddingConfig.existingWeddingSiteUrl) return;
  link.href = weddingConfig.existingWeddingSiteUrl;
  link.hidden = false;
}

async function connectSupabase() {
  if (!weddingConfig.supabaseUrl || !weddingConfig.supabaseAnonKey) {
    setStatus("Preview mode: photos save only in this browser until Supabase is configured.");
    return;
  }

  try {
    const { createClient } = await import(weddingConfig.supabaseCdn);
    supabase = createClient(weddingConfig.supabaseUrl, weddingConfig.supabaseAnonKey);
    setStatus("Live upload mode is connected.");
  } catch (error) {
    console.error(error);
    setStatus("Could not load Supabase. Preview mode is still available.");
  }
}

async function loadPhotos() {
  if (!supabase) {
    photos = JSON.parse(localStorage.getItem(localKey) || "[]");
    return;
  }

  const { data, error } = await supabase
    .from(weddingConfig.supabaseTable)
    .select("id,image_url,guest_name,note,created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    console.error(error);
    setStatus("Gallery could not load from Supabase yet.");
    return;
  }

  photos = data || [];
}

function setupRealtime() {
  if (supabase) {
    supabase
      .channel("wedding-photo-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: weddingConfig.supabaseTable },
        (payload) => {
          photos = [payload.new, ...photos];
          renderGallery();
        }
      )
      .subscribe();
    return;
  }

  channel?.addEventListener("message", (event) => {
    if (event.data?.type === "photo-added") {
      photos = JSON.parse(localStorage.getItem(localKey) || "[]");
      renderGallery();
    }
  });
}

function setupUploadForm() {
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
      for (const file of files) {
        const compressed = await compressImage(file).catch(() => file);
        const record = supabase
          ? await uploadToSupabase(compressed, guestName, note)
          : await uploadToLocalPreview(compressed, guestName, note);

        photos = [record, ...photos];
      }

      els.form.reset();
      renderGallery();
      setStatus("Uploaded. Thank you for adding to the gallery.");
      channel?.postMessage({ type: "photo-added" });
    } catch (error) {
      console.error(error);
      setStatus("Upload failed. Try one photo at a time or check the backend setup.");
    }
  });
}

async function uploadToSupabase(file, guestName, note) {
  const extension = file.type.split("/")[1] || "jpg";
  const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(weddingConfig.supabaseBucket)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl }
  } = supabase.storage.from(weddingConfig.supabaseBucket).getPublicUrl(path);

  const payload = {
    image_url: publicUrl,
    storage_path: path,
    guest_name: guestName,
    note
  };

  const { data, error } = await supabase
    .from(weddingConfig.supabaseTable)
    .insert(payload)
    .select("id,image_url,guest_name,note,created_at")
    .single();

  if (error) throw error;
  return data;
}

async function uploadToLocalPreview(file, guestName, note) {
  const imageUrl = await fileToDataUrl(file);
  const record = {
    id: crypto.randomUUID(),
    image_url: imageUrl,
    guest_name: guestName,
    note,
    created_at: new Date().toISOString()
  };
  const nextPhotos = [record, ...JSON.parse(localStorage.getItem(localKey) || "[]")].slice(0, 40);
  localStorage.setItem(localKey, JSON.stringify(nextPhotos));
  return record;
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only images can be uploaded.");
  }

  const imageUrl = await fileToDataUrl(file);
  const image = await loadImage(imageUrl);
  const maxEdge = 1800;
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })),
      "image/jpeg",
      0.86
    );
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

    img.src = photo.image_url;
    img.alt = photo.note ? `Wedding photo: ${photo.note}` : "Wedding guest photo";
    name.textContent = photo.guest_name || "Wedding guest";
    note.textContent = photo.note || formatDate(photo.created_at);
    els.gallery.append(item);
  });
}

async function setupQr() {
  els.qrUrl.textContent = uploadUrl;

  try {
    const QRCode = await import("https://esm.sh/qrcode@1.5.4");
    await QRCode.toCanvas(els.qrCanvas, uploadUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: "#7f1017",
        light: "#fff8f2"
      }
    });
  } catch (error) {
    console.error(error);
    const ctx = els.qrCanvas.getContext("2d");
    ctx.fillStyle = "#fff8f2";
    ctx.fillRect(0, 0, 240, 240);
    ctx.fillStyle = "#7f1017";
    ctx.font = "16px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("QR loads after deploy", 120, 112);
    ctx.fillText("Use the URL below", 120, 136);
  }
}

function setStatus(message) {
  els.status.textContent = message;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
