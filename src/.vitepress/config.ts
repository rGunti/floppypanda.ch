import { defineConfig } from '@jcamp/vitepress-blog-theme/config'

const PAGE_DATA = {
  title: 'FloppyPanda',
  description: 'something about tech, games or something completely different',
  defaultAuthor: 'FloppyPanda',
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: PAGE_DATA.title,
  description: PAGE_DATA.description,
  themeConfig: {
    blog: {
      title: PAGE_DATA.title,
      description: PAGE_DATA.description,
      defaultAuthor: PAGE_DATA.defaultAuthor,
      categoryIcons: {
        article: 'i-[heroicons-outline/book-open]',
        tutorial: 'i-[heroicons-outline/academic-cap]',
        document: 'i-[heroicons-outline/annotation]',
        announcement: 'i-[heroicons-outline/megaphone]',
      },
      tagIcons: {
        github: 'i-[carbon/logo-github]',
        vue: 'i-[carbon/logo-vue]',
        'web development': 'i-[carbon/earth-filled]',
      },
    },
    search: {
      provider: 'local',
    },
    nav: [
      {
        text: 'Tags',
        link: '/blog/tags',
        activeMatch: '/blog/tags',
      },
      {
        text: 'Archives',
        link: '/blog/archives',
        activeMatch: '/blog/archives',
      },
    ],

    sidebar: [],

    markdown: {
      image: {
        lazyLoading: true
      }
    },

    socialLinks: [
      {
        icon: 'twitter',
        link: 'https://bsky.app/floppypanda.ch',
      },
      {
        icon: 'mastodon',
        link: 'https://mastodon.social/@floppypanda',
      },
    ],
  },
})
