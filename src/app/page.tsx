import Link from "next/link";

export default function Inicio() {
  return (
    <main className="documento">
      <h1>NotariApp</h1>
      <p>Asistente virtual de WhatsApp para notarías.</p>
      <p>
        <Link href="/privacidad">Política de tratamiento de datos personales</Link>
      </p>
    </main>
  );
}
