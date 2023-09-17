[![Taxa de Commits](https://img.shields.io/github/commit-activity/m/G4brym/R2-Explorer?label=Commits&style=social)](https://github.com/G4brym/R2-Explorer/commits/main) [![Problemas](https://img.shields.io/github/issues/G4brym/R2-Explorer?style=social)](https://github.com/G4brym/R2-Explorer/issues) [![Licença de Software](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=social)](LICENSE)

Leia isso em outros idiomas: [English](README.md), [Español](READMEes.md), [Français](READMEfr.md)

# R2-Explorer

<p align="center">
    <em>Uma interface tipo Google Drive para seus Buckets do Cloudflare R2!</em>
</p>

<p>
  Este projeto é implantado/auto-hospedado em sua própria conta do Cloudflare como um Worker, e não são necessárias credenciais ou tokens para começar a usá-lo.
</p>

---

**Documentação**: [https://r2explorer.dev](https://r2explorer.dev)

**Demonstração ao Vivo**: [https://demo.r2explorer.dev](https://demo.r2explorer.dev)

---

## Recursos

- [Explorador de E-mail](https://r2explorer.dev/guides/setup-email-explorer/) (usando o Roteamento de E-mail do Cloudflare)
- [Autenticação Básica](https://r2explorer.dev/getting-started/security/#basic-auth)
- [Autenticação de Acesso do Cloudflare](https://r2explorer.dev/getting-started/security/)
- Navegação rápida de buckets/pastas
- Visualização no navegador de pdf, imagens, txt, markdown, csv, etc.
- Arraste e solte para carregar (Drag-and-Drop)
- Carregamento de múltiplos arquivos e pastas
- Criar pastas
- Carregar/Renomear/Download/Excluir arquivos
- Clique com o botão direito do mouse em um arquivo para opções adicionais
- Carregamento multipart para arquivos grandes

## Primeiros passos

Execute este comando para configurar um projeto de exemplo

```bash
npm create r2-explorer@latest
```

## Atualizar sua instalação

Para atualizar para a versão mais recente, você só precisa instalar o pacote r2-explorer mais recente do npm e reimplantar sua aplicação

```bash
npm install r2-explorer@latest --save
```

```bash
wrangler publish
```

## Tarefas pendentes
- Permitir nomes de buckets com espaços
- Procurar arquivos
- Renomear pastas
- Excluir pastas
- Miniaturas de imagens usando workers do Cloudflare
- Informações de ferramentas ao passar o mouse sobre um arquivo no formato "há x dias"
- Agrupar ícones do Bootstrap em vez de importá-los
