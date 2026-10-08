# Decisiones

- Precio y duración constantes en servidor: 4900 centavos USD y 30 minutos.
- No suscripciones, cupones, cobros de prueba reales ni reembolsos automáticos.
- Horarios UTC en persistencia; generación basada en zona IANA y visualización en zona elegida por cliente.
- Sin horarios inventados en producción: agenda pausada hasta configuración.
- Correo con cola y registro de intentos; entrega SMTP no equivale a recepción en bandeja.
