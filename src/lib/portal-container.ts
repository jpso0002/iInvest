/**
 * Where Radix overlays (dialogs, sheets) should render.
 *
 * By default Radix portals to `document.body` and positions with `position:
 * fixed`, which anchors to the viewport. The app lives inside a 390×844 phone
 * frame, so on a desktop window that made modals and bottom sheets span the
 * whole page instead of the device.
 *
 * Rendering into `.phone-frame` keeps them inside it — the frame is a
 * containing block for fixed descendants (see PhoneFrame.css), so `inset-0`
 * resolves to the phone, not the window.
 *
 * Returns `undefined` during SSR and before the frame mounts, which is exactly
 * what Radix expects for "use the default".
 */
export function phoneFrameContainer(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
  return (
    (document.querySelector(".phone-frame") as HTMLElement | null) ?? undefined
  );
}
