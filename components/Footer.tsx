import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border px-4 md:px-10 py-14" suppressHydrationWarning>
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-left" suppressHydrationWarning>

        {/* Brand column */}
        <div className="col-span-2 md:col-span-1" suppressHydrationWarning>
          <h3 className="font-serif text-xl tracking-[0.15em] uppercase mb-1" suppressHydrationWarning>Marebo Jewelry</h3>
          <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-4" suppressHydrationWarning>
            María Marín Reboloso
          </p>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed" suppressHydrationWarning>
            Joyería artesanal y mantones de diseño. Piezas únicas con alma de Sevilla.
          </p>
        </div>

        {/* Ayuda */}
        <div suppressHydrationWarning>
          <h4 className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4 text-foreground" suppressHydrationWarning>Ayuda</h4>
          <ul className="space-y-2.5" suppressHydrationWarning>
            <li>
              <Link href="/legal?tab=envios" className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
                Envíos
              </Link>
            </li>
            <li>
              <Link href="/legal?tab=devoluciones" className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
                Devoluciones
              </Link>
            </li>
            <li>
              <Link href="/legal?tab=tallas" className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
                Guía de Tallas
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div suppressHydrationWarning>
          <h4 className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4 text-foreground" suppressHydrationWarning>Legal</h4>
          <ul className="space-y-2.5" suppressHydrationWarning>
            <li>
              <Link href="/legal?tab=aviso-legal" className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
                Aviso Legal
              </Link>
            </li>
            <li>
              <Link href="/legal?tab=privacidad" className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
                Privacidad
              </Link>
            </li>
            <li>
              <Link href="/legal?tab=cookies" className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
                Cookies
              </Link>
            </li>
            <li>
              <Link href="/legal?tab=terminos" className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
                Términos y Condiciones
              </Link>
            </li>
          </ul>
        </div>

        {/* Contacto */}
        <div suppressHydrationWarning>
          <h4 className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4 text-foreground" suppressHydrationWarning>Contacto</h4>
          <ul className="space-y-2.5" suppressHydrationWarning>
            <li className="font-sans text-sm text-muted-foreground" suppressHydrationWarning>marebo.meri@gmail.com</li>
            <li className="font-sans text-sm text-muted-foreground" suppressHydrationWarning>+34 657 46 04 46</li>
            <li className="font-sans text-sm text-muted-foreground mt-1" suppressHydrationWarning>Santa Marta, España</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto mt-10 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="font-sans text-xs text-muted-foreground">
          &copy; 2026 MAREBO por María Marín Reboloso. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-5" suppressHydrationWarning>
          <Link href="/legal?tab=privacidad" className="font-sans text-xs text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
            Privacidad
          </Link>
          <Link href="/legal?tab=cookies" className="font-sans text-xs text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
            Cookies
          </Link>
          <Link href="/legal?tab=aviso-legal" className="font-sans text-xs text-muted-foreground hover:text-accent transition-colors" suppressHydrationWarning>
            Aviso Legal
          </Link>
        </div>
      </div>
    </footer>
  )
}
