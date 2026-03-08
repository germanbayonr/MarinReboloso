'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ChevronDown } from 'lucide-react'

type Tab =
  | 'envios'
  | 'devoluciones'
  | 'terminos'
  | 'privacidad'
  | 'cookies'
  | 'aviso-legal'
  | 'tallas'

const tabs: { id: Tab; label: string }[] = [
  { id: 'envios', label: 'Envíos' },
  { id: 'devoluciones', label: 'Devoluciones' },
  { id: 'tallas', label: 'Guía de Tallas' },
  { id: 'terminos', label: 'Términos y Condiciones' },
  { id: 'privacidad', label: 'Política de Privacidad' },
  { id: 'cookies', label: 'Política de Cookies' },
  { id: 'aviso-legal', label: 'Aviso Legal' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6 leading-snug">
      {children}
    </h2>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-foreground mt-8 mb-3">
      {children}
    </h3>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-sm text-gray-700 leading-relaxed mb-4">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="border-t border-border my-6" />
}

const content: Record<Tab, React.ReactNode> = {
  envios: (
    <div>
      <SectionTitle>Política de Envíos</SectionTitle>
      <Body>
        En MAREBO trabajamos exclusivamente con <strong>Correos</strong>, operador postal oficial de España, para garantizar la trazabilidad y seguridad de todos nuestros envíos.
      </Body>

      <SubTitle>Modalidades de envío</SubTitle>
      <Body>
        <strong>Envío Premium (24–48 h):</strong> Recibe tu pedido al día siguiente o en un plazo máximo de 48 horas hábiles desde la confirmación del pago. Disponible para Península e Islas Baleares.
      </Body>
      <Body>
        <strong>Envío Estándar (48–72 h):</strong> Entrega en un plazo de 2 a 3 días hábiles desde la confirmación del pago. Opción económica sin renunciar a la calidad del servicio de Correos.
      </Body>

      <Divider />
      <SubTitle>Puntos de entrega</SubTitle>
      <Body>
        Puedes elegir la opción que mejor se adapte a tu día a día:
      </Body>
      <ul className="font-sans text-sm text-gray-700 leading-relaxed list-disc list-inside space-y-2 mb-4">
        <li><strong>A domicilio:</strong> Tu cartero entregará el paquete en la dirección indicada.</li>
        <li><strong>Oficina de Correos:</strong> Recoge tu pedido en la oficina más cercana a tu conveniencia.</li>
        <li><strong>Taquillas Citypaq:</strong> Entrega en los lockers inteligentes Citypaq disponibles en múltiples puntos de España.</li>
      </ul>

      <Divider />
      <SubTitle>Intentos de entrega y plazo de recogida</SubTitle>
      <Body>
        El servicio de Correos realizará <strong>2 intentos de entrega a domicilio</strong>. Si no se pudiera contactar con el destinatario en ninguno de los intentos, el paquete quedará disponible en la <strong>oficina de Correos más cercana durante 15 días naturales</strong>. Transcurrido dicho plazo sin recogida, el envío será devuelto a MAREBO.
      </Body>
      <Body>
        En caso de devolución por no recogida, los gastos de reenvío correrán a cargo del cliente.
      </Body>

      <Divider />
      <SubTitle>Seguimiento del pedido</SubTitle>
      <Body>
        Una vez realizado el envío, recibirás un correo electrónico con el número de localizador para seguir tu pedido en tiempo real a través de la web de Correos (correos.es).
      </Body>
    </div>
  ),

  devoluciones: (
    <div>
      <SectionTitle>Política de Devoluciones</SectionTitle>
      <Body>
        En MAREBO queremos que estés completamente satisfecha con tu compra. Si por cualquier motivo no es así, puedes ejercer tu derecho de desistimiento.
      </Body>

      <SubTitle>Derecho de desistimiento</SubTitle>
      <Body>
        Dispones de <strong>14 días naturales</strong> desde la recepción de tu pedido para devolver cualquier artículo sin necesidad de indicar el motivo, conforme a lo establecido en el Real Decreto Legislativo 1/2007, de 16 de noviembre (Ley General para la Defensa de los Consumidores y Usuarios).
      </Body>

      <SubTitle>Condiciones del artículo</SubTitle>
      <Body>
        Para que la devolución sea aceptada, los artículos —pendientes, bolsos, collares y demás piezas— deben cumplir las siguientes condiciones:
      </Body>
      <ul className="font-sans text-sm text-gray-700 leading-relaxed list-disc list-inside space-y-2 mb-4">
        <li>Estar en su <strong>embalaje original</strong>, sin abrir ni dañar.</li>
        <li>No haber sido <strong>usados ni manipulados</strong> más allá de lo necesario para comprobar sus características.</li>
        <li>Incluir todos los <strong>accesorios y documentación</strong> que acompañaban al artículo.</li>
      </ul>

      <SubTitle>Proceso de devolución</SubTitle>
      <Body>
        Para iniciar una devolución, escríbenos a <strong>wayfar.meri@gmail.com</strong> indicando tu número de pedido y el motivo de la devolución. Te facilitaremos las instrucciones y la etiqueta de devolución en un plazo máximo de 48 horas.
      </Body>
      <Body>
        Una vez recibido y comprobado el estado del artículo, procederemos al reembolso del importe íntegro (excluidos los gastos de envío originales) en un plazo máximo de <strong>14 días naturales</strong>, utilizando el mismo método de pago empleado en la compra.
      </Body>

      <Divider />
      <SubTitle>Artículos personalizados</SubTitle>
      <Body>
        Las piezas realizadas bajo encargo o personalizadas expresamente para el cliente quedan excluidas del derecho de desistimiento, salvo defecto de fabricación.
      </Body>
    </div>
  ),

  tallas: (
    <div>
      <SectionTitle>Guía de Tallas</SectionTitle>
      <Body>
        Nuestras piezas de joyería son de talla única y se adaptan a todo tipo de lóbulos y muñecas. En caso de duda, no dudes en contactarnos antes de realizar tu compra.
      </Body>

      <SubTitle>Pendientes</SubTitle>
      <Body>
        Todos nuestros pendientes son de cierre de presión (clip) o de aguja estándar de 0,8 mm, compatible con la gran mayoría de perforaciones.
      </Body>

      <SubTitle>Collares</SubTitle>
      <Body>
        La longitud de cada collar se indica en la ficha de producto. Si necesitas un ajuste personalizado, consúltanos y estudiaremos opciones a medida sin coste adicional.
      </Body>

      <SubTitle>Bolsos</SubTitle>
      <Body>
        Las dimensiones exactas (alto × ancho × fondo) de cada bolso se especifican en la ficha de producto. Para más detalles sobre materiales o capacidad, escríbenos a wayfar.meri@gmail.com.
      </Body>
    </div>
  ),

  terminos: (
    <div>
      <SectionTitle>Términos y Condiciones</SectionTitle>
      <Body>
        Las presentes condiciones generales de contratación regulan la relación comercial entre MAREBO (titular: María Marín Reboloso) y el usuario que realiza una compra a través de la plataforma web.
      </Body>

      <SubTitle>1. Objeto</SubTitle>
      <Body>
        Estas condiciones tienen por objeto regular el proceso de adquisición de los productos ofertados en el sitio web, así como los derechos y obligaciones de ambas partes.
      </Body>

      <SubTitle>2. Proceso de compra</SubTitle>
      <Body>
        El usuario seleccionará los artículos deseados, los añadirá al carrito y completará el proceso de pago. La confirmación del pedido se enviará por correo electrónico a la dirección facilitada. El contrato se entenderá perfeccionado en el momento en que el usuario reciba dicha confirmación.
      </Body>

      <SubTitle>3. Precios y pagos</SubTitle>
      <Body>
        Todos los precios se muestran en euros (€) e incluyen el IVA aplicable. MAREBO se reserva el derecho a modificar precios en cualquier momento, sin perjuicio de los pedidos ya confirmados. Los métodos de pago aceptados se indicarán en el proceso de compra.
      </Body>

      <SubTitle>4. Disponibilidad</SubTitle>
      <Body>
        La disponibilidad de stock se actualiza en tiempo real. En caso de falta de existencias sobrevenida tras la confirmación del pedido, MAREBO se compromete a informar al cliente en el menor tiempo posible y a ofrecer un reembolso completo o un producto alternativo.
      </Body>

      <SubTitle>5. Legislación aplicable</SubTitle>
      <Body>
        Estas condiciones se rigen por la legislación española. Cualquier controversia derivada se someterá a los Juzgados y Tribunales de Sevilla, salvo que la normativa de consumidores establezca otro fuero imperativo.
      </Body>
    </div>
  ),

  privacidad: (
    <div>
      <SectionTitle>Política de Privacidad</SectionTitle>
      <Body>
        En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y de la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), le informamos de lo siguiente:
      </Body>

      <SubTitle>Responsable del tratamiento</SubTitle>
      <Body>
        <strong>Titular:</strong> María Marín Reboloso<br />
        <strong>Denominación comercial:</strong> MAREBO<br />
        <strong>Correo electrónico:</strong> wayfar.meri@gmail.com
      </Body>

      <SubTitle>Finalidad del tratamiento</SubTitle>
      <Body>
        Los datos personales que nos facilite serán tratados con las siguientes finalidades: (i) gestión de pedidos y envíos; (ii) atención al cliente; (iii) envío de comunicaciones comerciales, si ha prestado su consentimiento.
      </Body>

      <SubTitle>Base jurídica</SubTitle>
      <Body>
        La base jurídica del tratamiento es la ejecución de un contrato (Art. 6.1.b RGPD) para la gestión de pedidos, y el consentimiento del interesado (Art. 6.1.a RGPD) para el envío de comunicaciones comerciales.
      </Body>

      <SubTitle>Conservación de datos</SubTitle>
      <Body>
        Los datos se conservarán durante el tiempo necesario para cumplir la finalidad para la que fueron recabados y, en todo caso, durante los plazos legalmente establecidos.
      </Body>

      <SubTitle>Derechos del interesado</SubTitle>
      <Body>
        Puede ejercer sus derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición dirigiéndose por escrito a wayfar.meri@gmail.com, adjuntando copia de su documento de identidad. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).
      </Body>
    </div>
  ),

  cookies: (
    <div>
      <SectionTitle>Política de Cookies</SectionTitle>
      <Body>
        Este sitio web utiliza cookies para mejorar la experiencia del usuario, de conformidad con la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).
      </Body>

      <SubTitle>¿Qué son las cookies?</SubTitle>
      <Body>
        Las cookies son pequeños ficheros de texto que se almacenan en el dispositivo del usuario cuando visita un sitio web. Permiten al sitio web recordar sus acciones y preferencias durante un periodo de tiempo.
      </Body>

      <SubTitle>Cookies que utilizamos</SubTitle>
      <Body>
        <strong>Cookies técnicas (necesarias):</strong> Imprescindibles para el correcto funcionamiento del sitio web. No requieren consentimiento. Ejemplos: gestión de sesión y carrito de compra.
      </Body>
      <Body>
        <strong>Cookies analíticas:</strong> Nos permiten cuantificar el número de usuarios y analizar el comportamiento de navegación para mejorar nuestros servicios. Requieren su consentimiento previo.
      </Body>

      <SubTitle>Gestión de cookies</SubTitle>
      <Body>
        Puede aceptar, rechazar o configurar las cookies a través del panel de preferencias disponible en la primera visita al sitio. También puede gestionar las cookies desde la configuración de su navegador, aunque esto podría afectar al correcto funcionamiento de algunas funcionalidades.
      </Body>

      <SubTitle>Más información</SubTitle>
      <Body>
        Para más información sobre el uso de cookies, puede consultar la guía sobre el uso de cookies de la Agencia Española de Protección de Datos disponible en su web oficial (aepd.es).
      </Body>
    </div>
  ),

  'aviso-legal': (
    <div>
      <SectionTitle>Aviso Legal</SectionTitle>
      <Body>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los siguientes datos identificativos del titular del sitio web:
      </Body>

      <SubTitle>Datos del titular</SubTitle>
      <Body>
        <strong>Titular:</strong> María Marín Reboloso<br />
        <strong>Denominación comercial:</strong> MAREBO<br />
        <strong>Domicilio:</strong> Sevilla, España<br />
        <strong>Correo electrónico:</strong> wayfar.meri@gmail.com
      </Body>

      <SubTitle>Objeto y ámbito de aplicación</SubTitle>
      <Body>
        El presente Aviso Legal regula el acceso y uso del sitio web, así como los servicios puestos a disposición de los usuarios por MAREBO. El acceso a este sitio web implica la aceptación plena de las condiciones incluidas en este Aviso Legal.
      </Body>

      <SubTitle>Propiedad intelectual e industrial</SubTitle>
      <Body>
        Todos los contenidos del sitio web (textos, imágenes, diseños, logotipos, fotografías, software, etc.) son propiedad de María Marín Reboloso o de terceros que han autorizado su uso, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial. Queda expresamente prohibida su reproducción, distribución o comunicación pública sin autorización expresa y por escrito.
      </Body>

      <SubTitle>Responsabilidad</SubTitle>
      <Body>
        MAREBO no se hace responsable de los posibles daños o perjuicios que pudieran derivarse de interferencias, omisiones, interrupciones, virus informáticos u otras causas ajenas al control del titular. Asimismo, no garantiza la ausencia de errores en el contenido publicado, aunque se compromete a corregirlos en el menor tiempo posible.
      </Body>

      <SubTitle>Legislación aplicable y jurisdicción</SubTitle>
      <Body>
        Este Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia relacionada con el sitio web, las partes se someten a los Juzgados y Tribunales de Sevilla, con renuncia a cualquier otro fuero que pudiera corresponderles.
      </Body>
    </div>
  ),
}

export default function LegalPageClient() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('envios')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab | null
    if (tab && tabs.find((t) => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const activeLabel = tabs.find((t) => t.id === activeTab)?.label ?? ''

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      {/* Page header */}
      <div className="pt-24 pb-10 px-4 md:px-10 border-b border-border max-w-6xl mx-auto">
        <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-2">Centro de Ayuda y Políticas</p>
        <h1 className="font-serif text-3xl md:text-4xl text-foreground">Información Legal</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 py-12 flex flex-col md:flex-row gap-10">

        {/* Mobile: dropdown selector */}
        <div className="md:hidden w-full">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-full flex items-center justify-between border border-border px-4 py-3 font-sans text-sm text-foreground bg-background"
            suppressHydrationWarning
          >
            <span>{activeLabel}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileOpen && (
            <div className="border border-t-0 border-border bg-background">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileOpen(false) }}
                  className={`w-full text-left px-4 py-3 font-sans text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-secondary text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                  suppressHydrationWarning
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: sticky sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <nav className="sticky top-24 space-y-0.5" aria-label="Secciones legales">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 font-sans text-sm transition-colors border-l-2 ${
                  activeTab === tab.id
                    ? 'border-foreground text-foreground font-medium bg-secondary/40'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/20'
                }`}
                suppressHydrationWarning
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content area */}
        <article className="flex-1 min-w-0 max-w-2xl">
          {content[activeTab]}
        </article>
      </div>

      <Footer />
    </main>
  )
}
