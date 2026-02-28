import { beforeEach, vi } from "vitest";
import { config } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

// Mock quasar — avoid importing the full framework, provide only what components need
vi.mock("quasar", () => ({
	useQuasar: () => ({
		notify: vi.fn(),
		dialog: vi.fn(),
	}),
	EventBus: class {
		emit = vi.fn();
		on = vi.fn();
		off = vi.fn();
	},
}));

// Mock boot/axios — prevents real HTTP and window.location access at import time
vi.mock("boot/axios", () => {
	const defaults = { headers: { common: {} } };
	return {
		api: {
			get: vi.fn(),
			post: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
			defaults,
		},
	};
});

// Register all Quasar components used in the codebase as simple stubs.
// This avoids importing the heavy Quasar framework while allowing Vue to compile
// templates with q-* tags (including v-if/v-for on them) without errors.
const quasarComponentNames = [
	"QAvatar",
	"QBanner",
	"QBreadcrumbs",
	"QBreadcrumbsEl",
	"QBtn",
	"QBtnDropdown",
	"QBtnGroup",
	"QCard",
	"QCardActions",
	"QCardSection",
	"QChip",
	"QDialog",
	"QDrawer",
	"QField",
	"QForm",
	"QHeader",
	"QIcon",
	"QInfiniteScroll",
	"QInnerLoading",
	"QInput",
	"QItem",
	"QItemLabel",
	"QItemSection",
	"QLayout",
	"QLinearProgress",
	"QList",
	"QMenu",
	"QPage",
	"QPageContainer",
	"QSelect",
	"QSeparator",
	"QSpace",
	"QSpinner",
	"QSpinnerDots",
	"QTable",
	"QTd",
	"QToggle",
	"QToolbar",
	"QToolbarTitle",
	"QTooltip",
];

const stubs: Record<string, any> = {};
for (const name of quasarComponentNames) {
	stubs[name] = {
		name,
		props: ["label", "modelValue"],
		template:
			'<div><slot />{{ label }}<slot name="loading" /></div>',
	};
}

config.global.stubs = stubs;

// Stub Quasar directives (v-close-popup, etc.)
config.global.directives = {
	"close-popup": {},
};

// Provide a mock $bus (EventBus) for components that use this.$bus
config.global.mocks = {
	$bus: {
		emit: vi.fn(),
		on: vi.fn(),
		off: vi.fn(),
	},
};

// Initialize Pinia immediately so top-level store imports work during collection
setActivePinia(createPinia());

// Reset Pinia before each test so stores start clean
beforeEach(() => {
	setActivePinia(createPinia());
});
