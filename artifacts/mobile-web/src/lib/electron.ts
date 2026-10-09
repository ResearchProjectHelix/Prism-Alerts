type ElectronLaunchResult = "launched" | "not_installed" | "failed";

const OPEN_TIMEOUT_MS = 2500;

export function openPrismDesktop(): Promise<ElectronLaunchResult> {
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId: number | undefined;

    const finish = (result: ElectronLaunchResult) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      resolve(result);
    };

    const onVisibilityChange = () => {
      if (document.hidden) finish("launched");
    };
    const onBlur = () => finish("launched");

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    timeoutId = window.setTimeout(() => finish("not_installed"), OPEN_TIMEOUT_MS);

    try {
      // This URI carries no authentication token; Desktop only uses it to open
      // and focus its normal sign-in screen.
      window.location.href = "prism://auth/callback";
    } catch {
      finish("failed");
    }
  });
}