# Farrow Documentation Site

A comprehensive, bilingual documentation site for [Farrow](https://github.com/farrow-js/farrow) - A progressive TypeScript web framework.

![Farrow](./public/image.png)

## 🌟 Features

- 📚 **Bilingual Support**: Full documentation in both Chinese and English
- 🎨 **Modern Design**: Clean, responsive layout built with VitePress
- 🔍 **Full-text Search**: Fast local search functionality
- 📱 **Mobile Friendly**: Optimized for all device sizes
- 🌙 **Dark Mode**: Automatic theme switching support
- ⚡ **Fast Performance**: Static site generation for optimal loading speed

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/AisonSu/farrow-doc.git
cd farrow-doc

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit http://localhost:5173 to see the documentation site.

## 📝 Available Scripts

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Interactive commit (Commitizen)
pnpm commit
```

## 📂 Project Structure

```
farrow-vitepress/
├── .vitepress/           # VitePress configuration
│   └── config.mts        # Site configuration
├── guide/                # Guide documentation (Chinese)
│   ├── getting-started.md
│   ├── core-concepts.md
│   ├── essentials.md
│   ├── advanced.md
│   └── philosophy-and-practices.md
├── api/                  # API reference (Chinese)
│   ├── farrow-http.md
│   ├── farrow-schema.md
│   └── farrow-pipeline.md
├── ecosystem/            # Ecosystem packages (Chinese)
├── en/                   # English documentation
│   ├── guide/           # English guide
│   ├── api/             # English API reference
│   └── ecosystem/       # English ecosystem docs
├── public/              # Static assets
└── package.json         # Project configuration
```

## 🌐 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AisonSu/farrow-doc)

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/AisonSu/farrow-doc)

### Manual Deployment

1. Build the site:
   ```bash
   pnpm build
   ```

2. Deploy the `.vitepress/dist` directory to your hosting provider.

### GitHub Pages

The repository includes a GitHub Actions workflow for automatic deployment to GitHub Pages. Simply push to the `main` branch to trigger a deployment.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes using Commitizen (`pnpm commit`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This documentation site is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Farrow](https://github.com/farrow-js/farrow) - The framework being documented
- [VitePress](https://vitepress.dev) - The documentation site generator
- All contributors who have helped improve this documentation

## 📧 Contact

- Author: Aison
- Email: aisonsu@outlook.com
- GitHub: [@AisonSu](https://github.com/AisonSu)