// https://vitepress.dev/guide/custom-theme
import { VPBTheme } from '@jcamp/vitepress-blog-theme'
import CustomBlogHeader from './CustomBlogHeader.vue'
import './style.css'

export default {
  ...VPBTheme,
  enhanceApp({ app, router, siteData }) {
    VPBTheme.enhanceApp({ app, router, siteData })
    app.component('CustomBlogHeader', CustomBlogHeader)
  },
}

// if you're not using custom components, this file can be as simple as
/*
import { VPBTheme } from '@jcamp/vitepress-blog-theme'
import './style.css'
export default VBPTheme
*/
