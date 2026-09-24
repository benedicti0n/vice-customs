export const V2_FLAGS = {
  /** 3D garage/booth/reveal/street/card renderers enabled. */
  V2_3D: true,
  /** Legacy Unlayer paint booth (only when V2_3D is off or explicitly enabled). */
  V2_UNLAYER_LEGACY: process.env.NEXT_PUBLIC_VC_V2_UNLAYER === "1",
};

export function useUnlayerBooth(): boolean {
  return !V2_FLAGS.V2_3D || V2_FLAGS.V2_UNLAYER_LEGACY;
}