import MainLayout from "layouts/MainLayout.vue";
import HomePage from "pages/HomePage.vue";
import EmailFolderPage from "pages/email/EmailFolderPage.vue";
import FilesFolderPage from "pages/files/FilesFolderPage.vue";

const routes = [
	{
		path: "/auth",
		component: () => import("layouts/AuthLayout.vue"),
		children: [
			{
				path: "login",
				name: "login",
				component: () => import("pages/auth/LoginPage.vue"),
			},
			{
				path: "register",
				name: "register",
				component: () => import("pages/auth/RegisterPage.vue"),
			},
			{
				path: "forgot-password",
				name: "forgot-password",
				component: () => import("pages/auth/ForgotPasswordPage.vue"),
			},
			{
				path: "reset-password",
				name: "reset-password",
				component: () => import("pages/auth/ResetPasswordPage.vue"),
			},
		],
	},
	{
		path: "/",
		component: MainLayout,
		children: [
			{
				path: "/",
				name: "home",
				component: HomePage,
			},
			{
				path: "/:bucket/files",
				name: "files-home",
				component: FilesFolderPage,
			},
			{
				path: "/:bucket/files/:folder",
				name: "files-folder",
				component: FilesFolderPage,
			},
			{
				path: "/:bucket/files/:folder/:file",
				name: "files-file",
				component: FilesFolderPage,
			},

			{
				path: "/:bucket/email",
				name: "email-home",
				component: EmailFolderPage,
			},
			{
				path: "/:bucket/email/:folder",
				name: "email-folder",
				component: EmailFolderPage,
			},
			{
				path: "/:bucket/email/:folder/:file",
				name: "email-file",
				component: () => import("pages/email/EmailFilePage.vue"),
			},

			{
				path: "/:bucket/notes",
				name: "notes-home",
				component: () => import("pages/notes/NotesListPage.vue"),
			},
			{
				path: "/:bucket/notes/:note",
				name: "notes-note",
				component: () => import("pages/notes/NoteEditorPage.vue"),
			},

			// Admin routes
			{
				path: "/admin/settings",
				name: "admin-settings",
				component: () => import("pages/admin/SettingsPage.vue"),
				meta: { requiresAdmin: true },
			},

			// backwards compatibility
			{
				path: "/storage/:bucket",
				redirect: (to) => {
					return {
						name: "files-home",
						params: {
							bucket: to.params.bucket,
						},
					};
				},
			},
			{
				path: "/storage/:bucket/:folder",
				redirect: (to) => {
					return {
						name: "files-folder",
						params: {
							bucket: to.params.bucket,
							folder: to.params.folder,
						},
					};
				},
			},
			{
				path: "/storage/:bucket/:folder/:file",
				redirect: (to) => {
					return {
						name: "files-file",
						params: {
							bucket: to.params.bucket,
							folder: to.params.folder,
							file: to.params.file,
						},
					};
				},
			},
		],
	},

	// Always leave this as last one,
	// but you can also remove it
	{
		path: "/:catchAll(.*)*",
		component: () => import("pages/ErrorNotFound.vue"),
	},
];

export default routes;
