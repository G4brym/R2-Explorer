const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

async function deriveKey(
	password: string,
	salt: Uint8Array,
): Promise<ArrayBuffer> {
	const encoder = new TextEncoder();
	const passwordKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	return crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: ITERATIONS,
			hash: "SHA-256",
		},
		passwordKey,
		KEY_LENGTH * 8,
	);
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function hexToArrayBuffer(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const derivedKey = await deriveKey(password, salt);

	const saltHex = arrayBufferToHex(salt.buffer);
	const keyHex = arrayBufferToHex(derivedKey);

	// Format: salt:hash
	return `${saltHex}:${keyHex}`;
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	const [saltHex, storedKeyHex] = hash.split(":");
	if (!saltHex || !storedKeyHex) {
		return false;
	}

	const salt = hexToArrayBuffer(saltHex);
	const derivedKey = await deriveKey(password, salt);
	const derivedKeyHex = arrayBufferToHex(derivedKey);

	// Constant-time comparison
	if (derivedKeyHex.length !== storedKeyHex.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < derivedKeyHex.length; i++) {
		result |= derivedKeyHex.charCodeAt(i) ^ storedKeyHex.charCodeAt(i);
	}

	return result === 0;
}
