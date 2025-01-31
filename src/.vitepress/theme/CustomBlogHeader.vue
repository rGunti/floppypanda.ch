<script setup lang="ts">
import { usePosts } from '@jcamp/vitepress-blog-theme'
import { ref } from 'vue';

const data = usePosts()
const posts = ref(data.posts)
</script>

<template>
    <div class="mx-auto mb-8 max-w-screen-sm text-center lg:mb-16">
        <h2 class="mb-4 text-3xl font-extrabold tracking-tight text-[color:var(--vp-c-brand-light)] dark:text-[color:var(--vp-c-brand-dark)] lg:text-4xl">
            Looking for all my posts?
        </h2>
        <p class="font-light text-[color:var(--vp-c-text-light-1)] dark:text-[color:var(--vp-c-text-dark-1)] sm:text-xl">
            Here you go!
        </p>
    </div>

    <ul>
        <li v-for="(post, _) in posts">
            <article>
                <dl>
                    <dt class="sr-only">Published on</dt>
                    <dd class="text-base leading-6 font-medium text-gray-500 dark:text-gray-300">
                        <time :datetime="post.date.raw">{{ post.date.formatted }}</time>
                    </dd>
                </dl>
                <div class="space-y-5">
                    <h2 class="text-2xl leading-8 font-bold tracking-tight">
                        <a class="text-gray-900 dark:text-white" :href="post.url">{{ post.title }}</a>
                    </h2>
                    <div class="prose dark:prose-invert max-w-none text-gray-500 dark:text-gray-300" v-html="post.excerpt"></div>
                </div>
                <div class="text-base leading-6 font-medium">
                    <a class="link" aria-label="read more" :href="post.url">Read more →</a>
                </div>
            </article>
        </li>
    </ul>
</template>
