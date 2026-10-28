import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales | NotariApp",
  description:
    "Cómo se tratan los datos personales de quienes escriben al asistente virtual de WhatsApp de la notaría.",
};

// Identidad del responsable para este borrador. DATO DE PRUEBA: debe confirmarlo la notaría.
const RESPONSABLE = {
  nombre: "Notaría Única del Círculo de Santander de Quilichao",
  ciudad: "Santander de Quilichao, Cauca",
  correo: "unicasantanderdequilichao@supernotariado.gov.co",
};

const ULTIMA_ACTUALIZACION = "28 de octubre de 2026";

export default function Privacidad() {
  return (
    <main className="documento">
      <h1>Política de tratamiento de datos personales del asistente virtual de WhatsApp</h1>

      <p className="aviso-borrador" role="note">
        BORRADOR: debe revisarlo un abogado antes de atender ciudadanos reales.
      </p>

      <p>
        Esta política explica cómo se tratan los datos personales de las personas que escriben al
        asistente virtual de WhatsApp de la {RESPONSABLE.nombre}, de acuerdo con la Ley 1581 de 2012,
        el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas aplicables.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>{RESPONSABLE.nombre}</li>
        <li>{RESPONSABLE.ciudad}</li>
        <li>
          Correo para asuntos de datos personales:{" "}
          <a href={`mailto:${RESPONSABLE.correo}`}>{RESPONSABLE.correo}</a>
        </li>
      </ul>
      <p>
        La notaría usa la plataforma NotariApp para operar el asistente. NotariApp actúa como
        encargado del tratamiento: trata los datos solo por cuenta de la notaría y para las
        finalidades de esta política.
      </p>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>Número de celular de WhatsApp y nombre del perfil, si usted lo comparte en WhatsApp.</li>
        <li>Los mensajes que usted escribe al asistente y las respuestas que recibe.</li>
        <li>
          Si usted decide dejar una solicitud: su nombre, el trámite que le interesa y su preferencia
          de horario para que la notaría lo contacte.
        </li>
      </ul>
      <p>
        El asistente <strong>no le pedirá</strong> su número de cédula completo, fotos de documentos
        ni datos sensibles (salud, origen étnico, orientación política o religiosa, datos biométricos,
        entre otros). Le pedimos no enviarlos por este medio. Si llegara a enviarlos, no se usarán para
        ninguna finalidad.
      </p>

      <h2>3. Para qué usamos sus datos</h2>
      <ul>
        <li>Responder sus preguntas sobre requisitos, costos y horarios de los trámites notariales.</li>
        <li>Registrar su solicitud y avisar a la notaría para que un funcionario lo contacte.</li>
        <li>Pasar la conversación a una persona de la notaría cuando usted lo pida.</li>
        <li>
          Mejorar la calidad de las respuestas y llevar estadísticas de atención, con datos agregados
          que no lo identifican.
        </li>
      </ul>
      <p>No vendemos sus datos ni los usamos para publicidad.</p>

      <h2>4. Autorización</h2>
      <p>
        Al escribir al asistente, sus mensajes se tratan para responderle. Antes de registrar una
        solicitud con su nombre, el asistente le pedirá su autorización expresa. Sin esa autorización
        no se guarda la solicitud y usted puede seguir consultando información general.
      </p>

      <h2>5. Con quién se comparten</h2>
      <p>
        Para que el asistente funcione, sus mensajes pasan por proveedores tecnológicos que actúan
        como encargados y que pueden estar fuera de Colombia:
      </p>
      <ul>
        <li>Meta Platforms (WhatsApp), que transporta los mensajes.</li>
        <li>Anthropic (modelo de inteligencia artificial que redacta las respuestas).</li>
        <li>Supabase (almacenamiento de la información).</li>
        <li>Vercel (servidores de la aplicación).</li>
        <li>Resend (envío de correos de aviso a la notaría).</li>
      </ul>
      <p>
        Los correos que recibe la notaría solo incluyen lo necesario para contactarlo. Sus datos no se
        entregan a otros terceros, salvo por orden de autoridad competente.
      </p>
      {/* PENDIENTE DE REVISIÓN LEGAL: transferencia/transmisión internacional y contratos de transmisión con cada proveedor. */}

      <h2>6. Sus derechos</h2>
      <p>Como titular de los datos, usted puede:</p>
      <ul>
        <li>Conocer, actualizar y rectificar sus datos.</li>
        <li>Pedir prueba de la autorización que otorgó.</li>
        <li>Saber cómo se han usado sus datos.</li>
        <li>Revocar la autorización o pedir que se borren sus datos, cuando no exista un deber legal de conservarlos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio, después de acudir primero a la notaría.</li>
        <li>Acceder gratis a sus datos.</li>
      </ul>

      <h2>7. Cómo ejercer sus derechos</h2>
      <p>
        Escriba a <a href={`mailto:${RESPONSABLE.correo}`}>{RESPONSABLE.correo}</a> o acérquese a la
        notaría, indicando su nombre, su número de celular de WhatsApp y lo que solicita.
      </p>
      <ul>
        <li>Consultas: se responden en máximo 10 días hábiles, prorrogables 5 días hábiles más.</li>
        <li>Reclamos: se responden en máximo 15 días hábiles, prorrogables 8 días hábiles más.</li>
      </ul>

      <h2>8. Cuánto tiempo guardamos los datos</h2>
      <p>
        Los datos se conservan mientras sean necesarios para las finalidades descritas y para cumplir
        las obligaciones legales de la notaría.
      </p>
      {/* PENDIENTE DE REVISIÓN LEGAL: definir un plazo concreto de conservación de conversaciones y solicitudes. */}

      <h2>9. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y administrativas para proteger sus datos contra pérdida, acceso no
        autorizado o uso indebido, como el cifrado en tránsito y el acceso restringido a la información
        solo para el personal autorizado de la notaría.
      </p>

      <h2>10. Cambios a esta política</h2>
      <p>
        Cualquier cambio se publicará en esta página. Última actualización: {ULTIMA_ACTUALIZACION}.
      </p>
    </main>
  );
}
