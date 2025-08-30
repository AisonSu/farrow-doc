import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Farrow",
  
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      description: '渐进式 TypeScript Web 框架 - 类型安全 · 函数式 · 渐进式',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '指南', link: '/guide/getting-started' },
          { text: 'API', link: '/api/' },
          { 
            text: '生态系统',
            items: [
              { text: 'farrow-http', link: '/ecosystem/farrow-http' },
              { text: 'farrow-schema', link: '/ecosystem/farrow-schema' },
              { text: 'farrow-pipeline', link: '/ecosystem/farrow-pipeline' },
              { text: 'farrow-express', link: '/ecosystem/farrow-express' },
              { text: 'farrow-cors', link: '/ecosystem/farrow-cors' },
              { text: 'farrow-koa', link: '/ecosystem/farrow-koa' }
            ]
          }
        ],
        
        sidebar: {
          '/guide/': [
            {
              text: '开始',
              items: [
                { text: '快速开始', link: '/guide/getting-started' },
                { text: '核心概念', link: '/guide/core-concepts' }
              ]
            },
            {
              text: '基础',
              items: [
                { text: '基础教程', link: '/guide/essentials' },
                { text: '├ 路由系统详解', link: '/guide/essentials#路由系统详解' },
                { text: '├ Schema 定义与验证', link: '/guide/essentials#schema-定义与验证' },
                { text: '├ 中间件系统', link: '/guide/essentials#中间件系统' },
                { text: '├ 响应构建', link: '/guide/essentials#响应构建' },
                { text: '├ Context 系统', link: '/guide/essentials#context-系统' },
                { text: '├ 错误处理', link: '/guide/essentials#错误处理' },
                { text: '└ 实战：博客 API', link: '/guide/essentials#实战-构建完整的博客-api' }
              ]
            },
            {
              text: '进阶',
              items: [
                { text: '深度教程', link: '/guide/advanced' },
                { text: '├ Pipeline 高级特性', link: '/guide/advanced#farrow-pipeline-高级特性' },
                { text: '├ Schema 高级特性', link: '/guide/advanced#farrow-schema-高级特性' },
                { text: '├ HTTP 高级特性', link: '/guide/advanced#farrow-http-高级特性' },
                { text: '├ 实战案例', link: '/guide/advanced#实战案例-综合应用' },
                { text: '哲学与最佳实践', link: '/guide/philosophy-and-practices' }
              ]
            }
          ],
          '/api/': [
            {
              text: 'API 参考',
              items: [
                { text: '概览', link: '/api/' },
                { text: 'farrow-http', link: '/api/farrow-http' },
                { text: 'farrow-schema', link: '/api/farrow-schema' },
                { text: 'farrow-pipeline', link: '/api/farrow-pipeline' }
              ]
            }
          ]
        },
        
        footer: {
          message: '这是一个第三方 Farrow 文档站 | 用 ❤️ 和 TypeScript 构建',
          copyright: 'MIT Licensed | Copyright © 2025 Aison'
        },
        
        search: {
          provider: 'local',
          options: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                }
              }
            }
          }
        },
        
        docFooter: {
          prev: '上一页',
          next: '下一页'
        },
        
        lastUpdated: {
          text: '最后更新于',
          formatOptions: {
            dateStyle: 'short',
            timeStyle: 'medium'
          }
        },
        
        outline: {
          label: '页面导航',
          level: [2, 3]
        }
      }
    },
    
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      description: 'Progressive TypeScript Web Framework - Type-Safe · Functional · Progressive',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Guide', link: '/en/guide/getting-started' },
          { text: 'API', link: '/en/api/' },
          { 
            text: 'Ecosystem',
            items: [
              { text: 'farrow-http', link: '/en/ecosystem/farrow-http' },
              { text: 'farrow-schema', link: '/en/ecosystem/farrow-schema' },
              { text: 'farrow-pipeline', link: '/en/ecosystem/farrow-pipeline' },
              { text: 'farrow-express', link: '/en/ecosystem/farrow-express' },
              { text: 'farrow-cors', link: '/en/ecosystem/farrow-cors' },
              { text: 'farrow-koa', link: '/en/ecosystem/farrow-koa' }
            ]
          }
        ],
        
        sidebar: {
          '/en/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Quick Start', link: '/en/guide/getting-started' },
                { text: 'Core Concepts', link: '/en/guide/core-concepts' }
              ]
            },
            {
              text: 'Essentials',
              items: [
                { text: 'Tutorial', link: '/en/guide/essentials' },
                { text: '├ Routing System', link: '/en/guide/essentials#routing-system' },
                { text: '├ Schema Definition', link: '/en/guide/essentials#schema-definition-and-validation' },
                { text: '├ Middleware System', link: '/en/guide/essentials#middleware-system' },
                { text: '├ Response Building', link: '/en/guide/essentials#response-building' },
                { text: '├ Context System', link: '/en/guide/essentials#context-system' },
                { text: '├ Error Handling', link: '/en/guide/essentials#error-handling' },
                { text: '└ Tutorial: Blog API', link: '/en/guide/essentials#tutorial-building-a-complete-blog-api' }
              ]
            },
            {
              text: 'Advanced',
              items: [
                { text: 'Deep Dive', link: '/en/guide/advanced' },
                { text: '├ Pipeline Advanced', link: '/en/guide/advanced#farrow-pipeline-advanced-features' },
                { text: '├ Schema Advanced', link: '/en/guide/advanced#farrow-schema-advanced-features' },
                { text: '├ HTTP Advanced', link: '/en/guide/advanced#farrow-http-advanced-features' },
                { text: '├ Real-world Examples', link: '/en/guide/advanced#real-world-examples' },
                { text: 'Philosophy & Best Practices', link: '/en/guide/philosophy-and-practices' }
              ]
            }
          ],
          '/en/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'Overview', link: '/en/api/' },
                { text: 'farrow-http', link: '/en/api/farrow-http' },
                { text: 'farrow-schema', link: '/en/api/farrow-schema' },
                { text: 'farrow-pipeline', link: '/en/api/farrow-pipeline' }
              ]
            }
          ]
        },
        
        footer: {
          message: 'This is a third-party Farrow documentation site | Built with ❤️ and TypeScript',
          copyright: 'MIT Licensed | Copyright © 2025 Aison'
        },
        
        search: {
          provider: 'local'
        },
        
        docFooter: {
          prev: 'Previous',
          next: 'Next'
        },
        
        lastUpdated: {
          text: 'Last updated',
          formatOptions: {
            dateStyle: 'short',
            timeStyle: 'medium'
          }
        },
        
        outline: {
          label: 'On this page',
          level: [2, 3]
        }
      }
    }
  },
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/image.png',
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/farrow-js/farrow' }
    ]
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/image.png' }]
  ],
  
  ignoreDeadLinks: true
})