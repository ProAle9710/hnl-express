export class PickCanceled extends Error {
  constructor() {
    super("Selección cancelada.");
    this.name = "PickCanceled";
  }
}

export type PickedImage = {
  base64: string;
  mimeType: string;
  uri: string;
};

export function pickImageFile(capture: boolean): Promise<PickedImage> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  if (capture) input.setAttribute("capture", "environment");
  input.style.position = "fixed";
  input.style.opacity = "0";
  input.style.width = "44px";
  input.style.height = "44px";
  document.body.appendChild(input);

  return new Promise((resolve, reject) => {
    const finish = () => {
      input.remove();
    };
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        finish();
        reject(new PickCanceled());
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => {
        finish();
        reject(new Error("No se pudo leer la imagen."));
      };
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          finish();
          reject(new Error("No se pudo leer la imagen."));
          return;
        }
        const base64 = result.slice(result.indexOf(",") + 1);
        finish();
        resolve({
          base64,
          mimeType: file.type || "image/jpeg",
          uri: URL.createObjectURL(file),
        });
      };
      reader.readAsDataURL(file);
    });
    input.addEventListener("cancel", () => {
      finish();
      reject(new PickCanceled());
    });
    input.click();
  });
}

export function openReceiptPrint(html: string): void {
  const popup = window.open("", "_blank");
  if (!popup) {
    throw new Error("Safari bloqueó el comprobante. Permite ventanas emergentes para este sitio.");
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}

export function configureIosWebDocument(): void {
  document.title = "HNL XPRESS";
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=overlays-content",
    );
  }
  const style = document.createElement("style");
  style.setAttribute("data-hnl-ios", "true");
  style.textContent = `
    html, body, #root {
      height: 100%;
      height: 100dvh;
      overflow: hidden;
      overscroll-behavior: none;
    }
    @media (max-width: 719px) {
      body {
        position: fixed;
        inset: 0;
        width: 100%;
      }
    }
    #hnl-brand-copy {
      transition: opacity 180ms ease, transform 180ms ease;
    }
  `;
  document.head.appendChild(style);
}
