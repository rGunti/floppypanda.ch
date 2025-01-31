---
date: 2024-03-13
title: 'How to create a website (like this one)'
tags:
  - web development
---

You want to create a website like this one? Well if you know a little bit about JavaScript and Markdown, you can do this in about an hour.

---

This website is built using a project called [Vitepress][vitepress], a website generator that can make a website out of Markdown documents. Now Vitepress is mostly intended for technical documentation, however there exists a theme called [VitePress Blog][vitepress-blog]. Pulling this all together, this page is hosted on [GitHub Pages][ghp], a free hosting solution from GitHub. And finally to automate deployment, I use [GitHub Actions][gha], which produces the final webpage, that is then uploaded to GitHub Pages.

Now if you want to know how this page works, you can checkout the [GitHub repository][git] behind this page. But if you actually want to start your own page, I recommend looking at the [VitePress Blog template][vpb-template]. If you have the required tooling installed, you can use this command in a terminal to get started:

```bash
npx degit https://github.com/jcamp-code/starter-vitepress-blog
```

For more information, checkout [their documentation][vpb-docs].

## What you'll need to get started

You will need the following things to get started:

- a web browser,
- [Node.js][nodejs],
- a GitHub account,
- a code editor (like [VS Code][vs-code]),
- and a terminal

With all that, follow this checklist to get started:

1. Create a new project folder and make it a Git repository
2. Run the command above in a terminal, which will create a copy of the template project
3. Open your project in your code editor and update the configuration file at `src/.vitepress/config.ts` to your needs
4. Start writing some content in the markdown files provided or create new ones
5. Push the project to a new GitHub repository
6. Setup GitHub Pages
7. Add a GitHub Actions pipeline (feel free to copy [mine][workflow])
8. (optionally) Get your own domain and connect it with GitHub

With that, you should be able to run your own blog like this one. The only thing remaining is... well... to write content.

[git]: https://github.com/rGunti/how-did-that-work
[gha]: https://docs.github.com/en/actions
[ghp]: https://pages.github.com/
[nodejs]: https://nodejs.org
[vitepress]: https://vitepress.dev/
[vitepress-blog]: https://vitepressblog.dev/
[vpb-docs]: https://vitepressblog.dev/guide/what-is-vitepress-blog
[vpb-template]: https://github.com/jcamp-code/starter-vitepress-blog
[vs-code]: https://code.visualstudio.com/
[workflow]: https://github.com/rGunti/how-did-that-work/blob/main/.github/workflows/docs.yml
