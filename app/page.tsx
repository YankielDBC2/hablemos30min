import Link from 'next/link';
import BookingWidget from '@/components/booking-widget';
import UiIcon from '@/components/ui-icon';
import { HOME_JSON_LD, publicMetadata, serializeJsonLd } from '@/lib/seo';

export const metadata = publicMetadata(
  '/',
  'Consulta de IA y desarrollo por 49 USD',
  'Reserva 30 minutos con Yankiel para hablar de IA, sitios web, apps y diseño. En español, por WhatsApp o llamada. 49 USD, pago único y sin reembolsos.',
);

export default function HomePage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(HOME_JSON_LD) }} />
    <a className="h30-skip" href="#contenido">Saltar al contenido</a>
    <header className="h30-header h30-wrap">
      <Link className="h30-brand" href="/"><span className="h30-mark" aria-hidden="true">30</span><span>hablemos<span className="h30-brand-min">30min</span></span></Link>
      <nav aria-label="Navegación principal"><a className="h30-nav-link" href="#como-funciona">Cómo funciona</a><a className="h30-nav-book" href="#reservar">Reservar</a></nav>
    </header>
    <main id="contenido" className="h30-wrap">
      <section className="h30-hero" aria-labelledby="hero-title">
        <div className="h30-hero-copy">
          <p className="h30-eyebrow">CONSULTA CON YANKIEL</p>
          <h1 id="hero-title">Hablemos de<br /><span>tu proyecto.</span></h1>
          <p className="h30-description">30 minutos para revisar tus dudas de tecnología y definir los próximos pasos.</p>
          <ul className="h30-topics" aria-label="Temas de consulta"><li>Inteligencia artificial</li><li>Sitios web</li><li>Aplicaciones</li><li>Desarrollo</li><li>Diseño</li></ul>
          <div className="h30-hero-action"><a className="h30-button h30-primary" href="#reservar">Elegir horario <UiIcon name="right" /></a><div className="h30-hero-price"><strong>$49 <span>USD</span></strong><span>Pago único · Sin reembolsos</span></div></div>
          <div className="h30-host"><div><strong>Yankiel D. Beltrán Cabrera</strong><span>En español · WhatsApp o llamada</span></div></div>
        </div>
        <div id="reservar" className="h30-booking-area"><BookingWidget /></div>
      </section>
      <section className="h30-how" id="como-funciona" aria-labelledby="how-title"><div className="h30-section-intro"><h2 id="how-title">Cómo funciona</h2></div><ol className="h30-how-steps"><li><span className="h30-step-number">01</span><h3>Elige fecha y hora</h3><p>Selecciona un horario y completa tus datos.</p></li><li><span className="h30-step-number">02</span><h3>Confirma con un pago</h3><p>49 USD por 30 minutos. Recibirás la confirmación por correo.</p></li><li><span className="h30-step-number">03</span><h3>Recibe la llamada</h3><p>Te llamaré al celular indicado, por el canal que elijas.</p></li></ol></section>
      <section className="h30-faq" aria-labelledby="faq-title"><div><h2 id="faq-title">Preguntas frecuentes</h2></div><div className="h30-faq-list">
        <details><summary>¿Qué podemos ver en 30 minutos?<span aria-hidden="true"><UiIcon name="plus" /></span></summary><p>Una duda concreta, una idea de sitio web o aplicación, cómo incorporar IA a tu proyecto o una decisión de desarrollo y diseño. Elige una prioridad y trae el contexto que ya tengas.</p></details>
        <details><summary>¿Necesito saber de tecnología?<span aria-hidden="true"><UiIcon name="plus" /></span></summary><p>No. Puedes venir con una idea inicial o con un proyecto en marcha. La conversación parte de lo que necesitas y usamos un lenguaje claro.</p></details>
        <details><summary>¿La consulta incluye desarrollar mi proyecto?<span aria-hidden="true"><UiIcon name="plus" /></span></summary><p>Los 49 USD corresponden únicamente a la consulta de 30 minutos. La implementación de un sitio web, una aplicación o un diseño se evalúa por separado.</p></details>
        <details><summary>¿Cómo y cuándo nos reunimos?<span aria-hidden="true"><UiIcon name="plus" /></span></summary><p>Elige WhatsApp o llamada telefónica al reservar. Yankiel te llamará al celular que indiques. El horario de atención es de lunes a viernes de 9:00 a 20:00 y los sábados de 11:00 a 16:00, hora de Miami. La agenda muestra únicamente los espacios disponibles.</p></details>
        <details><summary>¿El pago es recurrente? ¿Hay reembolsos?<span aria-hidden="true"><UiIcon name="plus" /></span></summary><p>Es un único pago de 49 USD por la sesión elegida. No es una suscripción. Las reservas son sin reembolsos; revisa la fecha, la hora y los <Link href="/terminos">términos de la consulta</Link> antes de pagar.</p></details>
      </div></section>
    </main>
    <footer className="h30-footer h30-wrap"><Link className="h30-footer-brand" href="/">hablemos<span>30min</span></Link><nav aria-label="Información"><Link href="/terminos">Términos</Link><Link href="/privacidad">Privacidad</Link><a href="mailto:business@hablemos30min.online">Contacto</a><Link href="/admin">Administración</Link></nav></footer>
  </>;
}
