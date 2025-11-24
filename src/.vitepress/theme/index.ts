// https://vitepress.dev/guide/custom-theme
import { VPBTheme } from '@jcamp/vitepress-blog-theme'
import giscusTalk from 'vitepress-plugin-comment-with-giscus';
import CustomBlogHeader from './CustomBlogHeader.vue'
import './style.css'
import { toRefs } from 'vue';
import { useData, useRoute } from 'vitepress';

export default {
  ...VPBTheme,
  enhanceApp({ app, router, siteData }) {
    VPBTheme.enhanceApp({ app, router, siteData })
    app.component('CustomBlogHeader', CustomBlogHeader)
  },
  setup() {
    // Get frontmatter and route
    const { frontmatter } = toRefs(useData());
    const route = useRoute();
    
    // Obtain configuration from: https://giscus.app/
    giscusTalk({
        repo: 'rGunti/floppypanda.ch',
        repoId: 'R_kgDONyU4ig',
        category: 'Article Comments', // default: `General`
        categoryId: 'DIC_kwDONyU4is4Cy0fZ',
        mapping: 'pathname', // default: `pathname`
        inputPosition: 'bottom', // default: `top`
        lang: 'en', // default: `zh-CN`
        // i18n setting (Note: This configuration will override the default language set by lang)
        // Configured as an object with key-value pairs inside:
        // [your i18n configuration name]: [corresponds to the language pack name in Giscus]
        locales: {
          'en-US': 'en'
        },
        homePageShowComment: false, // Whether to display the comment area on the homepage, the default is false
        lightTheme: 'light', // default: `light`
        darkTheme: 'transparent_dark', // default: `transparent_dark`
        // ...
    }, {
        frontmatter, route
    },
        // Whether to activate the comment area on all pages.
        // The default is true, which means enabled, this parameter can be ignored;
        // If it is false, it means it is not enabled.
        // You can use `comment: true` preface to enable it separately on the page.
        false
    );
},
}

// if you're not using custom components, this file can be as simple as
/*
import { VPBTheme } from '@jcamp/vitepress-blog-theme'
import './style.css'
export default VBPTheme
*/
