import { weddingConfig } from "./config.js";

const localKey = "marty-miriam-wedding-photos";

export function createGalleryApi() {
  let supabase = null;

  return {
    get hasSupabase() {
      return Boolean(supabase);
    },
    async connect() {
      if (supabase) return supabase;
      if (!weddingConfig.supabaseUrl || !weddingConfig.supabaseAnonKey) return null;

      const { createClient } = await import(weddingConfig.supabaseCdn);
      supabase = createClient(weddingConfig.supabaseUrl, weddingConfig.supabaseAnonKey);
      return supabase;
    },
    async loadPhotos() {
      if (!supabase) {
        return JSON.parse(localStorage.getItem(localKey) || "[]");
      }

      const { data, error } = await supabase
        .from(weddingConfig.supabaseTable)
        .select("id,image_url,storage_path,guest_name,note,created_at")
        .order("created_at", { ascending: false })
        .limit(240);

      if (error) throw error;
      return data || [];
    },
    subscribe(onInsert) {
      if (!supabase) return null;

      return supabase
        .channel("wedding-photo-feed")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: weddingConfig.supabaseTable },
          (payload) => onInsert(payload.new)
        )
        .subscribe();
    },
    async uploadPhoto(file, guestName, note) {
      if (!supabase) {
        const imageUrl = await fileToDataUrl(file);
        const record = {
          id: crypto.randomUUID(),
          image_url: imageUrl,
          storage_path: "",
          guest_name: guestName,
          note,
          created_at: new Date().toISOString()
        };
        const nextPhotos = [record, ...JSON.parse(localStorage.getItem(localKey) || "[]")].slice(0, 40);
        localStorage.setItem(localKey, JSON.stringify(nextPhotos));
        return record;
      }

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

      const { data, error } = await supabase
        .from(weddingConfig.supabaseTable)
        .insert({
          image_url: publicUrl,
          storage_path: path,
          guest_name: guestName,
          note
        })
        .select("id,image_url,storage_path,guest_name,note,created_at")
        .single();

      if (error) throw error;
      return data;
    },
    async deletePhoto(photo) {
      if (!supabase) {
        const photos = JSON.parse(localStorage.getItem(localKey) || "[]").filter((item) => item.id !== photo.id);
        localStorage.setItem(localKey, JSON.stringify(photos));
        return;
      }

      const { error: rowError } = await supabase
        .from(weddingConfig.supabaseTable)
        .delete()
        .eq("id", photo.id);

      if (rowError) throw rowError;

      if (photo.storage_path) {
        const { error: storageError } = await supabase.storage
          .from(weddingConfig.supabaseBucket)
          .remove([photo.storage_path]);

        if (storageError) throw storageError;
      }
    }
  };
}

export async function compressImage(file) {
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

export function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
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
