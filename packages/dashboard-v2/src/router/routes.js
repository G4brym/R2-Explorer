const routes = [
  {
    path: "/auth",
    component: () => import("layouts/AuthLayout.vue"),
    children: [
      { path: "login", name: "login", component: () => import("pages/auth/LoginPage.vue") }
    ]
  },
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "/", name: "home", component: () => import("pages/HomePage.vue") },
      { path: "/:bucket/files", name: "files-home", component: () => import("pages/files/FilesFolderPage.vue") },
      {
        path: "/:bucket/files/:folder",
        name: "files-folder",
        component: () => import("pages/files/FilesFolderPage.vue")
      },
      {
        path: "/:bucket/files/:folder/:file",
        name: "files-file",
        component: () => import("pages/files/FilesFolderPage.vue")
      },

      { path: "/:bucket/email", name: "email-home", component: () => import("pages/email/EmailFolderPage.vue") },
      {
        path: "/:bucket/email/:folder",
        name: "email-folder",
        component: () => import("pages/email/EmailFolderPage.vue")
      },
      {
        path: "/:bucket/email/:folder/:file",
        name: "email-file",
        component: () => import("pages/email/EmailFilePage.vue")
      },

      // backwards compatibility
      {
        path: "/storage/:bucket",
        redirect: to => {
          return {
            name: "files-home",
            params: {
              bucket: to.params.bucket
            }
          };
        }
      },
      {
        path: "/storage/:bucket/:folder",
        redirect: to => {
          return {
            name: "files-folder",
            params: {
              bucket: to.params.bucket,
              folder: to.params.folder
            }
          };
        }
      },
      {
        path: "/storage/:bucket/:folder/:file",
        redirect: to => {
          return {
            name: "files-file",
            params: {
              bucket: to.params.bucket,
              folder: to.params.folder,
              file: to.params.file
            }
          };
        }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue")
  }
];

export default routes;
