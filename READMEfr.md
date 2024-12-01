[![Taux de commits](https://img.shields.io/github/commit-activity/m/G4brym/R2-Explorer?label=Commits&style=social)](https://github.com/G4brym/R2-Explorer/commits/main) [![Problèmes](https://img.shields.io/github/issues/G4brym/R2-Explorer?style=social)](https://github.com/G4brym/R2-Explorer/issues) [![Licence logicielle](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=social)](LICENSE)

Lisez ceci dans d'autres langues : [English](README.md), [Español](READMEes.md), [Português](READMEpt.md)

# R2-Explorer

<p align="center">
    <em>Une interface Google Drive pour vos compartiments Cloudflare R2 !</em>
</p>

<p>
  Ce projet est déployé/auto-hébergé dans votre propre compte Cloudflare en tant que Worker, et aucun identifiant/token n'est requis pour commencer à l'utiliser.
</p>

---

**Documentation** : <a href="https://r2explorer.dev" target="_blank">https://r2explorer.dev</a>

**Démo en direct** : <a href="https://demo.r2explorer.dev" target="_blank">https://demo.r2explorer.dev</a>

---

## Fonctionnalités

- [Explorateur d'e-mails](https://r2explorer.dev/guides/setup-email-explorer/) (utilisant le routage des e-mails Cloudflare)
- [Authentification de base](https://r2explorer.dev/getting-started/security/#basic-auth)
- [Authentification Cloudflare Access](https://r2explorer.dev/getting-started/security/)
- Navigation très rapide dans les compartiments/dossiers
- Aperçu dans le navigateur de fichiers PDF, images, texte, markdown, CSV, etc.
- Téléchargement par glisser-déposer
- Téléchargement de fichiers et de dossiers multiples
- Création de dossiers
- Téléchargement/Renommer/Téléchargement/Suppression de fichiers
- Clic droit sur un fichier pour des options supplémentaires
- Téléchargement multipart pour les gros fichiers

## Pour commencer

Exécutez cette commande pour configurer un projet exemple

```bash
npm create cloudflare@latest r2-explorer -- --template "G4brym/R2-Explorer/template"
```

## Mise à jour de votre installation

Pour mettre à jour vers la dernière version, il vous suffit d'installer le dernier package r2-explorer depuis npm et de redéployer votre application

```bash
npm install r2-explorer@latest --save
```

```bash
wrangler publish
```

## À FAIRE

- Autoriser les noms de compartiments avec des espaces
- Rechercher des fichiers
- Renommer des dossiers
- Supprimer des dossiers
- Miniatures d'images avec les travailleurs Cloudflare
- Info-bulle lors du survol d'un fichier avec le format "il y a x jours"
- Regrouper les icônes Bootstrap au lieu de les importer
