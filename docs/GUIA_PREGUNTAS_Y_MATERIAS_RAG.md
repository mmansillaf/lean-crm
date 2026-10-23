# Guía de Materias, Preguntas Frecuentes y Reglas Comerciales
**Proyecto:** Lean CRM — Algoritmo Jurídico SAC  
**Fecha:** 2026-10-23  

---

## 1. Fuentes Exclusivas y Alcance Autorizado

El motor RAG y el bot de WhatsApp están acotados única y exclusivamente a los siguientes 3 sitios web:
1. **Portal Corporativo y Buscador de Normas:** `https://algoritmojuridico.com/buscador`
2. **Plataforma IA Legal Especializada:** `https://servicios.algoritmojuridico.com/ialegal/`
3. **Buscador de Procesos Constitucionales (TC 2016–2026):** `https://procesosconstitucionales.algoritmojuridico.com/`

> **Nota de Aislamiento:** Toda información de clínicas, temas dentales u organizaciones demo fue purgada de la base de datos (PostgreSQL). El RAG opera exclusivamente con las 46 entidades y 42 relaciones semánticas de Algoritmo Jurídico SAC.

---

## 2. Catálogo Oficial de Suscripciones y Reglas de Handoff

* **Suscripción por 6 Meses:** **S/ 250 PEN** (Soles peruanos).
* **Suscripción por 1 Año:** **S/ 450 PEN** (Soles peruanos).
* **Cuentas Corporativas (> 3 cuentas):** Si un estudio jurídico o institución solicita 4 o más licencias, el bot activa automáticamente el traspaso a un asesor comercial humano (`[HUMAN_HANDOFF]`) para una cotización corporativa personalizada.
* **Patrocinio Legal Directo:** El bot no ejerce representación legal directa ni patrocina causas ante juzgados o SUNAT; orienta técnicamente y transfiere a un abogado humano si se requiere patrocinio.

---

## 3. Banco de Preguntas por Categoría

### Categoría A: Precios, Planes y Suscripciones
* *"¿Cuánto cuesta la suscripción al buscador de jurisprudencia?"*  
  -> Detalla los planes de 6 meses (S/ 250) y 1 año (S/ 450).
* *"Somos un estudio de 5 abogados y queremos usar la plataforma, ¿qué precio nos dan?"*  
  -> Detecta más de 3 cuentas y transfiere cordialmente a un asesor comercial.
* *"¿Qué beneficios incluye el plan anual de 450 soles?"*  
  -> Explica acceso completo al buscador, alertas inmediatas de El Peruano y análisis de compliance.

### Categoría B: Herramientas Tecnológicas de Algoritmo Jurídico SAC
* *"¿Qué funciones tiene su Analizador de Contratos IA?"*  
  -> Explica detección de cláusulas abusivas, omisiones y riesgos legales en segundos.
* *"¿Puedo redactar minutas o poderes con su sistema?"*  
  -> Describe el Generador de Documentos Legales bajo normativa peruana.
* *"¿Cómo funciona su buscador frente a las publicaciones de El Peruano?"*  
  -> Detalla la indexación continua de leyes, decretos y alertas normativas directas.

### Categoría C: Derecho Tributario & SUNAT
* *"¿Cuáles son las exigencias del crédito fiscal en el IGV según la ley peruana?"*  
  -> Detalla bancarización, detracciones y comprobantes de pago válidos.
* *"¿Qué establece el artículo 37 de la LIR sobre causalidad de gastos?"*  
  -> Cita la Ley del Impuesto a la Renta y criterios vinculantes del Tribunal Fiscal.

### Categoría D: Procesos Constitucionales & Tribunal Constitucional (2016–2026)
* *"¿Qué resoluciones tienen sobre Hábeas Data en los últimos 5 años?"*  
  -> Explica el repositorio de 11 años de jurisprudencia constitucional del TC.
* *"¿Cuáles son los precedentes vinculantes en Procesos de Amparo contra resoluciones judiciales?"*  
  -> Expone la doctrina jurisprudencial sobre debido proceso y tutela efectiva.

### Categoría E: Derecho Laboral & SUNAFIL
* *"¿Cómo se calculan las vacaciones truncas y la CTS en el régimen laboral general?"*  
  -> Explica la normativa sobre beneficios sociales y plazos de ley.
* *"¿Qué multas impone SUNAFIL por exceso de jornada de trabajo sin pago de horas extra?"*  
  -> Cita las infracciones en materia de relaciones laborales.

### Categoría F: Derecho Civil & Posesión
* *"¿Qué criterios vinculantes fijó el IV Pleno Casatorio Civil sobre ocupantes precarios?"*  
  -> Resume los supuestos de posesión sin título o con título fenecido.
