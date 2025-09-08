import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Farrow",
  base: "/",
  
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      description: '渐进式 TypeScript Web 框架 - 类型安全 · 函数式 · 渐进式',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '指南', link: '/guide/essentials' },
          { text: 'API', link: '/api/' },
          { 
            text: '生态系统',
            items: [
              { text: '中间件生态对比', link: '/ecosystem/middleware-comparison' },
              { text: 'farrow-express', link: '/ecosystem/farrow-express' },
              { text: 'farrow-cors', link: '/ecosystem/farrow-cors' },
              { text: 'farrow-koa', link: '/ecosystem/farrow-koa' }
            ]
          }
        ],
        
        sidebar: {
          '/guide/': [
            {
              text: '基础教程',
              items: [
                { text: '开始使用', link: '/guide/essentials' },
                { text: '核心概念与设计哲学', link: '/guide/philosophy-and-practices' }
              ]
            },
            {
              text: '深入指南',
              items: [
                { text: '高级特性概览', link: '/guide/advanced' }
              ]
            },
            {
              text: 'HTTP 路由系统',
              items: [
                { text: '路由参数进阶', link: '/guide/advanced-routing' },
                { text: 'Router 系统与模块化路由', link: '/guide/flexible-routing' },
                { text: 'Response 构建与处理', link: '/guide/advanced-response' }
              ]
            },
            {
              text: 'Schema 验证系统',
              items: [
                { text: 'Schema 高级类型', link: '/guide/advanced-schema' },
                { text: 'Schema 操作与变换', link: '/guide/schema-operations' }
              ]
            },
            {
              text: 'Pipeline 中间件系统',
              items: [
                { text: 'Pipeline 完整指南', link: '/guide/pipeline-concepts' }
              ]
            },
            {
              text: '独立教程',
              items: [
                { text: 'Pipeline 渐进式学习指南', link: '/guide/pipeline-tutorial' },
                { text: 'Schema 渐进式学习指南', link: '/guide/schema-tutorial' }
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
          { text: 'Guide', link: '/en/guide/essentials' },
          { text: 'Tutorial', link: '/en/tutorial/' },
          { 
            text: 'Pipeline Tutorial',
            link: '/en/pipeline-tutorial/'
          },
          { text: 'API', link: '/en/api/' },
          { 
            text: 'Ecosystem',
            items: [
              { text: 'Middleware Comparison', link: '/en/ecosystem/middleware-comparison' },
              { text: 'farrow-express', link: '/en/ecosystem/farrow-express' },
              { text: 'farrow-cors', link: '/en/ecosystem/farrow-cors' },
              { text: 'farrow-koa', link: '/en/ecosystem/farrow-koa' }
            ]
          }
        ],
        
        sidebar: {
          '/en/guide/': [
            {
              text: 'Tutorial',
              items: [
                { text: 'Getting Started', link: '/en/guide/essentials' },
                { text: 'Core Concepts & Philosophy', link: '/en/guide/philosophy-and-practices' }
              ]
            },
            {
              text: 'Deep Dive Guide',
              items: [
                { text: 'Advanced Features Overview', link: '/en/guide/advanced' }
              ]
            },
            {
              text: 'HTTP Routing System',
              items: [
                { text: 'Advanced Routing Parameters', link: '/en/guide/advanced-routing' },
                { text: 'Router System & Modular Routing', link: '/en/guide/flexible-routing' },
                { text: 'Response Building & Processing', link: '/en/guide/advanced-response' }
              ]
            },
            {
              text: 'Schema Validation System',
              items: [
                { text: 'Advanced Schema Types', link: '/en/guide/advanced-schema' },
                { text: 'Schema Operations & Transformations', link: '/en/guide/schema-operations' }
              ]
            },
            {
              text: 'Pipeline Middleware System',
              items: [
                { text: 'Pipeline Complete Guide', link: '/en/guide/pipeline-concepts' }
              ]
            },
            {
              text: 'Independent Tutorials',
              items: [
                { text: 'Pipeline Progressive Learning Guide', link: '/en/guide/pipeline-tutorial' },
                { text: 'Schema Progressive Learning Guide', link: '/en/guide/schema-tutorial' }
              ]
            }
          ],
          '/en/tutorial/': [
            {
              text: 'Farrow Pipeline Progressive Tutorial',
              items: [
                { text: '📚 Tutorial Overview', link: '/en/tutorial/' },
                { text: '🌟 Chapter 1: Why Pipeline?', link: '/en/tutorial/01-why-pipeline' },
                { text: '🏗️ Chapter 2: Build Your First App', link: '/en/tutorial/02-build-first-app' },
                { text: '🔗 Chapter 3: State Management', link: '/en/tutorial/03-context-state-management' },
                { text: '🎨 Chapter 4: Advanced Composition', link: '/en/tutorial/04-advanced-composition' }
              ]
            }
          ],
          '/en/pipeline-tutorial/': [
            {
              text: 'Farrow Pipeline Progressive Tutorial',
              items: [
                { text: '📚 Tutorial Overview', link: '/en/pipeline-tutorial/' },
                { text: '🚀 Chapter 1: Getting Started', link: '/en/pipeline-tutorial/01-getting-started' },
                { text: '🧠 Chapter 2: Core Concepts', link: '/en/pipeline-tutorial/02-core-concepts' },
                { text: '🎭 Chapter 3: Middleware Patterns', link: '/en/pipeline-tutorial/03-middleware-patterns' },
                { text: '🗃️ Chapter 4: State Management', link: '/en/pipeline-tutorial/04-context-management' },
                { text: '🔗 Chapter 5: Pipeline Composition', link: '/en/pipeline-tutorial/05-composition' },
                { text: '⏰ Chapter 6: Async Patterns', link: '/en/pipeline-tutorial/06-async-patterns' },
                { text: '🛡️ Chapter 7: Error Handling', link: '/en/pipeline-tutorial/07-error-handling' },
                { text: '🧪 Chapter 8: Testing Strategies', link: '/en/pipeline-tutorial/08-testing' },
                { text: '🏢 Chapter 9: Real-world Cases', link: '/en/pipeline-tutorial/09-real-world' },
                { text: '💎 Chapter 10: Best Practices', link: '/en/pipeline-tutorial/10-best-practices' }
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