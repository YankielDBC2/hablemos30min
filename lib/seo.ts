import type { Metadata } from 'next';

// Canonicals always identify the public domain, including preview deployments.
export const SITE_URL = 'https://hablemos30min.online';
export const SITE_NAME = 'Hablemos30min';
export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/og-hablemos30min.png`,
  width: 1200,
  height: 630,
  alt: 'Hablemos30min: consulta de 30 minutos con Yankiel, en español, por 49 USD',
};

export function publicMetadata(path: string, title: string, description: string): Metadata {
  const url = new URL(path, SITE_URL).toString();
  const socialTitle = `${title} · ${SITE_NAME}`;
  return {
    title: path === '/' ? { absolute: socialTitle } : title,
    description,
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'es_US',
      type: 'website',
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [{ url: SOCIAL_IMAGE.url, alt: SOCIAL_IMAGE.alt }],
    },
  };
}

export function privateMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: new URL(path, SITE_URL).toString() },
    robots: { index: false, follow: false, nocache: true, nosnippet: true },
  };
}

export const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: 'es',
      publisher: { '@id': `${SITE_URL}/#yankiel` },
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: 'Consulta de IA y desarrollo por 49 USD · Hablemos30min',
      inLanguage: 'es',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      mainEntity: { '@id': `${SITE_URL}/#consulta` },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#yankiel`,
      name: 'Yankiel D. Beltrán Cabrera',
      knowsLanguage: 'es',
    },
    {
      '@type': 'Service',
      '@id': `${SITE_URL}/#consulta`,
      name: 'Consulta de 30 minutos con Yankiel',
      description: 'Consulta en español sobre inteligencia artificial, sitios web, aplicaciones, desarrollo o diseño. Dura 30 minutos por WhatsApp o llamada telefónica. Pago único de 49 USD, sin reembolsos. La implementación de proyectos se evalúa por separado.',
      serviceType: 'Consulta sobre inteligencia artificial, desarrollo web, aplicaciones y diseño',
      provider: { '@id': `${SITE_URL}/#yankiel` },
      url: `${SITE_URL}/#reservar`,
      termsOfService: `${SITE_URL}/terminos`,
      availableChannel: {
        '@type': 'ServiceChannel',
        name: 'Reserva en línea; consulta por WhatsApp o llamada telefónica',
        availableLanguage: 'es',
        serviceUrl: `${SITE_URL}/#reservar`,
      },
      offers: {
        '@type': 'Offer',
        '@id': `${SITE_URL}/#oferta`,
        name: 'Una consulta de 30 minutos',
        description: 'Pago único por una sesión de 30 minutos. Sin suscripción ni reembolsos.',
        price: '49.00',
        priceCurrency: 'USD',
        url: `${SITE_URL}/#reservar`,
        itemOffered: { '@id': `${SITE_URL}/#consulta` },
      },
    },
  ],
};

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export const LLM_TEXT = `# Hablemos30min

> Consulta de 30 minutos con Yankiel D. Beltrán Cabrera, exclusivamente en español. Precio fijo: 49 USD por sesión, pago único y sin reembolsos.

## Servicio

Temas: inteligencia artificial, sitios web, aplicaciones, desarrollo y diseño. La consulta sirve para revisar dudas, opciones y prioridades de un proyecto. No incluye desarrollar un sitio web, una aplicación ni un diseño; la implementación se evalúa por separado. No se garantiza un resultado específico.

El cliente elige WhatsApp o llamada telefónica al reservar. Yankiel llama al celular indicado en el formulario. El horario habitual es lunes a viernes de 09:00 a 20:00 y sábado de 11:00 a 16:00, zona America/New_York (Miami). La agenda del sitio muestra la disponibilidad efectiva en la zona horaria del cliente.

## Reserva y pago

La reserva solicita nombre, correo, celular con código de país, tema, canal de llamada, fecha y zona horaria; las notas son opcionales. Se requiere aceptar la política sin reembolsos. La selección de horario no confirma una cita: la reserva queda confirmada tras verificar el pago de 49 USD con Stripe. Se envían confirmación y recordatorios por correo.

## Páginas públicas

- [Inicio y agenda](https://hablemos30min.online/): descripción del servicio, preguntas frecuentes y selección de horario.
- [Términos de la consulta](https://hablemos30min.online/terminos): precio, duración, puntualidad y política sin reembolsos.
- [Privacidad](https://hablemos30min.online/privacidad): uso de los datos de reserva y servicios que intervienen.
- [Mapa del sitio](https://hablemos30min.online/sitemap.xml): URLs públicas para descubrimiento.

## Contacto y privacidad

Contacto público: business@hablemos30min.online.

La administración y la confirmación de cada reserva son páginas privadas excluidas de indexación. Las APIs y los enlaces con identificadores de pago no son fuentes de contenido público. Los datos de clientes y de citas no forman parte de este documento.

## Fuentes

La información oficial y vigente del servicio está en las páginas públicas indicadas y en la agenda. No hay testimonios, calificaciones, estadísticas de clientes ni promesas de resultados publicados como evidencia del servicio.
`;
