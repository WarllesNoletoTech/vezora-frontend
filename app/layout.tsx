import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, Manrope } from 'next/font/google';
import './globals.css';

// Hospedagem local de fontes pelo Next.js: evita CSS externo bloqueante.
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-dm-sans' });
const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-manrope' });

export const metadata: Metadata = {
 metadataBase: new URL('https://vezora-agendamentos.vercel.app'),
 title: { default: 'Vezora — Sua marca. Sua agenda.', template: '%s | Vezora' },
 description: 'Agendamento online para barbearias, nail designers, lash designers e profissionais de beleza. Personalize sua página, organize horários e receba sinais via Mercado Pago.',
 applicationName: 'Vezora',
 openGraph: { type: 'website', locale: 'pt_BR', siteName: 'Vezora', title: 'Vezora — Sua marca. Sua agenda.', description: 'Agendamentos com a sua identidade visual.', images: ['/og-vezora.png'] },
 twitter: { card: 'summary_large_image', images: ['/og-vezora.png'] },
 manifest: '/manifest.webmanifest',
 icons: { icon: [{ url: '/favicon.ico', sizes: 'any' }, {url:'/favicon-32x32.png',sizes:'32x32',type:'image/png'}], apple: [{url:'/apple-touch-icon.png', sizes:'180x180'}] },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#172737' };
// Captura antecipadamente o evento de instalação: ele pode acontecer antes da hidratação React.
// Não inicia uma instalação sem gesto do usuário; apenas disponibiliza o evento ao botão.
const installEventBridge = `(function(){
  window.__vezoraInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', function(event) {
    event.preventDefault();
    window.__vezoraInstallPrompt = event;
    window.dispatchEvent(new Event('vezora:install-ready'));
  });
  window.addEventListener('appinstalled', function() { window.__vezoraInstallPrompt = null; });
})();`;
export default function RootLayout({children}:{children:ReactNode}){
 return <html lang="pt-BR" className={`${dmSans.variable} ${manrope.variable}`}><head><script dangerouslySetInnerHTML={{__html:installEventBridge}}/></head><body>{children}</body></html>;
}
