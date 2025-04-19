import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Canto do Livro',
  description: 'Aplicação para organização de livros e interação com outros leitores',
  generator: '...',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  )
}
