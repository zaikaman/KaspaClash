/**
 * Device detection utilities.
 */

/**
 * Checks if the current device is a mobile or tablet device.
 * Uses a combination of User Agent sniffing and feature detection.
 */
export function isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for common mobile user agents
    if (/android/i.test(userAgent)) return true;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return true;

    // Check for other mobile devices
    if (/Mobile|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        return true;
    }

    // Check for potential tablets (touch enabled + smaller than desktop)
    // iPad Pro 12.9 is 1024x1366, standard desktop is usually > 1280
    const isTouch = navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 1280; // Treat anything <= 1280 + touch as "mobile/tablet" for UI purposes

    return isTouch && isSmallScreen;
}
