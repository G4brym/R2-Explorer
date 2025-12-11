/**
 * Browser compatibility utilities
 * Handles Unicode-safe base64 encoding and safe storage access for private browsing
 */

/**
 * Unicode-safe base64 encoding
 * Standard btoa() fails with non-ASCII characters, this handles them properly
 */
export function safeBase64Encode(str: string): string {
	try {
		// First try standard btoa for ASCII-only strings (faster)
		return btoa(str);
	} catch {
		// Fall back to Unicode-safe encoding
		return btoa(
			encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
				String.fromCharCode(Number.parseInt(p1, 16)),
			),
		);
	}
}

/**
 * Unicode-safe base64 decoding
 */
export function safeBase64Decode(str: string): string {
	try {
		// First try standard atob
		return atob(str);
	} catch {
		// Fall back to Unicode-safe decoding
		return decodeURIComponent(
			Array.from(atob(str))
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join(""),
		);
	}
}

/**
 * Safe localStorage/sessionStorage getter
 * Handles private browsing mode where storage may be unavailable
 */
export function safeStorageGet(key: string): string | null {
	try {
		return sessionStorage.getItem(key) ?? localStorage.getItem(key);
	} catch {
		return null;
	}
}

/**
 * Safe localStorage setter
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
	try {
		localStorage.setItem(key, value);
		return true;
	} catch {
		console.warn("localStorage not available (private browsing mode?)");
		return false;
	}
}

/**
 * Safe localStorage getter
 */
export function safeLocalStorageGet(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

/**
 * Safe sessionStorage setter
 */
export function safeSessionStorageSet(key: string, value: string): boolean {
	try {
		sessionStorage.setItem(key, value);
		return true;
	} catch {
		console.warn("sessionStorage not available (private browsing mode?)");
		return false;
	}
}

/**
 * Safe storage removal
 */
export function safeStorageRemove(key: string): void {
	try {
		localStorage.removeItem(key);
		sessionStorage.removeItem(key);
	} catch {
		// Storage not available
	}
}
