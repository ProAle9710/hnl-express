import { useEffect, useState } from "react";
import { Platform } from "react-native";

function typing(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
}

function resetScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function useWebKeyboard() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const nav = navigator as Navigator & {
      virtualKeyboard?: {
        overlaysContent: boolean;
        boundingRect: DOMRect;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      };
    };
    const virtual = nav.virtualKeyboard;
    if (virtual) virtual.overlaysContent = true;
    let rest = window.visualViewport?.height ?? window.innerHeight;

    const measure = () => {
      const viewport = window.visualViewport;
      const fromVirtual = virtual?.boundingRect.height ?? 0;
      if (!typing() && fromVirtual < 40) return 0;
      if (fromVirtual > 40) return Math.round(fromVirtual);
      if (!viewport) return 0;
      const shrink = rest - viewport.height - viewport.offsetTop;
      return shrink > 80 ? Math.round(shrink) : 0;
    };

    const update = () => {
      const next = measure();
      if (next === 0) {
        rest = window.visualViewport?.height ?? window.innerHeight;
        resetScroll();
      }
      setHeight(next);
    };

    const onBlur = () => {
      window.setTimeout(update, 50);
    };

    update();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    virtual?.addEventListener("geometrychange", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", onBlur);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      virtual?.removeEventListener("geometrychange", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  return height;
}
