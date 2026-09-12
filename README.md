# Rolling Robotics Education Website

A modern, responsive website built with Next.js, TypeScript, and Tailwind CSS for Rolling Robotics Education - empowering students through robotics education, mentorship, and innovation.

[Rolling Robotics Website](https://rollingrobotics.org)

## 🚀 Features

### Modern Design & UX
- **Clean, professional design** with modern card-based layouts
- **Responsive design** that works on all devices
- **Dark mode support** with smooth transitions
- **Smooth animations** powered by Framer Motion
- **Accessible design** following WCAG AA guidelines
- **Sushi FTC Tutor** with mobile-friendly chat, official FIRST citations, and
  strict FTC-only scope

### Performance & SEO
- **Lighthouse score ≥90** for optimal performance
- **Hybrid rendering** for fast pages plus a secure server-side tutor API
- **SEO optimized** with next-seo integration
- **Open Graph** meta tags for social sharing
- **Automatic sitemap** generation
- **Optimized images** with Next.js Image component

### Key Sections
- **Hero carousel** with inspiring messages and CTAs
- **Mission statement** with core values
- **Impact statistics** with animated counters
- **Programs overview** with detailed cards
- **Team highlights** showcasing community
- **Sponsor recognition** with scrolling display
- **Multiple call-to-action** sections

### Technical Excellence
- **TypeScript** for type safety
- **Component-based architecture** for maintainability
- **Tailwind CSS** for consistent styling
- **Modular design system** with reusable components
- **Modern React patterns** with hooks and context
- **Azure AI Foundry grounding** using live official FIRST pages and the current
  FTC competition manual

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **SEO**: next-seo
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Theme**: next-themes

## 📁 Project Structure

```
src/
├── app/                  # App Router pages
│   ├── about/           # About page
│   ├── contact/         # Contact page
│   ├── api/ftc-tutor/   # Grounded Azure AI Foundry endpoint
│   ├── programs/        # Programs page
│   ├── sushi-ftc-tutor/ # FTC-only student tutor
│   ├── support/         # Support page
│   ├── team/            # Team page
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Homepage
│   ├── robots.ts        # Robots.txt generation
│   └── sitemap.ts       # Sitemap generation
├── components/          # Reusable components
│   ├── call-to-action.tsx
│   ├── footer.tsx
│   ├── hero-section.tsx
│   ├── mission-section.tsx
│   ├── navigation.tsx
│   ├── programs-preview.tsx
│   ├── providers.tsx
│   ├── sponsor-strip.tsx
│   ├── stats-section.tsx
│   └── team-preview.tsx
└── types/               # TypeScript definitions
    └── index.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 22.0 or later
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Littlemnmi/rollingrobotics.git
   cd rollingrobotics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test:ftc` - Run offline tutor context, scope, retrieval, and response regression tests
- `npm run manual:update` - Check for and convert the latest official FTC manual

### Sushi FTC Tutor configuration

Copy `.env.example` to `.env.local` and configure the Azure AI Foundry model:

```bash
AZURE_FOUNDRY_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com
AZURE_FOUNDRY_API_KEY=YOUR-KEY
AZURE_FOUNDRY_MODEL=YOUR-DEPLOYMENT-NAME
```

`AZURE_FOUNDRY_ENDPOINT` must expose the OpenAI-compatible `/openai/v1`
Responses API. The equivalent `AZURE_OPENAI_ENDPOINT`,
`AZURE_OPENAI_API_KEY`, and `AZURE_OPENAI_DEPLOYMENT` names are also accepted.
Keep API keys in Azure App Service settings; never commit them.

Questions default to the FTC game and season in the active competition manual.
Students can ask "how do you earn ranking points in this year's game?" or short
follow-ups without including FTC keywords. The model applies this context before
deciding scope; clearly unrelated requests are still declined. The default season
follows manual updates automatically rather than being hard-coded.

The bundled `data/ftc-game-manual.md` is generated from the official
competition-manual PDF. Each Node server process checks the official manual
endpoint immediately on startup and every ten minutes, converts a newer PDF to
Markdown, and replaces the local copy atomically. Azure App Service stores the
runtime copy under its persistent home directory. Set `FTC_MANUAL_PATH` to use
another writable location, or set `FTC_MANUAL_AUTO_UPDATE=false` to disable the
background check.

## 🌐 Deployment

### Azure App Service

The tutor requires a Node.js server and is deployed with Next.js standalone
output. Configure the three Azure Foundry app settings above, then use the
included Azure Web App workflows. The deployment package includes the generated
manual data alongside the standalone server.


## 🎨 Design System

### Colors
- **Primary**: Blue tones for main brand elements
- **Secondary**: Complementary blue for accents
- **Accent**: Purple for highlights and CTAs

### Typography
- **System fonts** for optimal loading performance
- **Responsive sizing** with mobile-first approach
- **Proper hierarchy** with semantic heading levels

### Components
- **Consistent spacing** using Tailwind's scale
- **Hover effects** for interactive elements
- **Focus states** for accessibility
- **Loading states** for dynamic content

## 📱 Responsive Design

- **Mobile-first** approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Flexible layouts** that adapt to any screen size
- **Touch-friendly** interface elements

## ♿ Accessibility

- **WCAG AA compliant** design patterns
- **Keyboard navigation** support
- **Screen reader** compatible
- **High contrast** color schemes
- **Focus indicators** for all interactive elements
- **Semantic HTML** structure

## 🔧 Customization

### Adding New Pages

1. Create a new directory in `src/app/`
2. Add a `page.tsx` file with the page component
3. Update navigation in `src/components/navigation.tsx`
4. Add to sitemap in `src/app/sitemap.ts`

### Modifying Content

- **Hero slides**: Edit the `slides` array in `hero-section.tsx`
- **Programs**: Update the `programs` array in `programs-preview.tsx`
- **Statistics**: Modify the `stats` array in `stats-section.tsx`
- **Team info**: Edit team data in `team-preview.tsx`

### Styling Changes

- **Global styles**: Edit `src/app/globals.css`
- **Tailwind config**: Modify `tailwind.config.js`
- **Color scheme**: Update the color palette in Tailwind config

## 📈 Performance

- **Lighthouse scores**: 90+ across all metrics
- **Core Web Vitals**: Optimized for LCP, FID, and CLS
- **Image optimization**: Next.js Image component with lazy loading
- **Code splitting**: Automatic with Next.js App Router
- **Caching**: Static generation for optimal caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

**Rolling Robotics Education**
- Email: contact@rollingrobotics.org
- Website: [rollingrobotics.org](https://rollingrobotics.org)

## 📄 License

This project is licensed under the MIT License.

---

*Built with ❤️ for the Rolling Robotics Education community*
