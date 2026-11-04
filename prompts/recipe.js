// Recipe builders moved verbatim from src/App.jsx.
// focusLine is built inside each builder from focusValue, with
// [SYSTEM]/[SISTEMA]/[DISCIPLINE]/[DISCIPLINA] when no value is set.
export const TIER_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };

// Mixed split: 20% Easy / 60% Medium / 20% Hard, rounded so the three always sum to the block size.
export function mixedCounts(size) {
  const easy = Math.round(size * 0.2);
  const hard = Math.round(size * 0.2);
  return { easy, medium: size - easy - hard, hard };
}

// What each difficulty asks the AI for (vignette length, reasoning steps, options, clue counts).
export const RECIPE_PROFILES = {
  en: {
    names: { easy: "Easy", medium: "Medium", hard: "Hard" },
    ratings: { easy: "1-2", medium: "3", hard: "4-5" },
    easy: {
      vignette: "1-3 short sentences focused on classic buzzwords and pathognomonic findings",
      step: "direct 1-step or 2-step recognition (e.g. identifying a condition straight from its primary presentation)",
      options: "3-4 options (A-D at most) with distinct, non-overlapping distractors",
      clues: "2-3", phrases: "2-3",
    },
    medium: {
      vignette: "3-5 sentences with standard clinical context (age/sex, chief complaint, history, exam, key labs/imaging)",
      step: "2-step clinical reasoning (e.g. Vignette → Diagnosis → Best Initial Test)",
      options: "5 options (A-E) with realistic clinical distractors",
      clues: "3-4", phrases: "3-4",
    },
    hard: {
      vignette: "5-8 sentences containing subtle clinical nuances, extra lab data, and potential red herrings",
      step: "3-step high-yield reasoning (e.g. Vignette → Diagnosis → Pathophysiology of the treatment mechanism)",
      options: "5 options (A-E) with closely related differential options requiring subtle discriminators",
      clues: "4-5", phrases: "4-5",
    },
  },
  es: {
    names: { easy: "Fácil", medium: "Media", hard: "Difícil" },
    ratings: { easy: "1-2", medium: "3", hard: "4-5" },
    easy: {
      vignette: "1 a 3 oraciones cortas centradas en palabras clave clásicas y hallazgos patognomónicos",
      step: "reconocimiento directo de 1 o 2 pasos (p. ej., identificar la condición directamente a partir de su presentación principal)",
      options: "3 a 4 opciones (como máximo A-D) con distractores distintos que no se solapen",
      clues: "2-3", phrases: "2-3",
    },
    medium: {
      vignette: "3 a 5 oraciones con contexto clínico estándar (edad/sexo, motivo de consulta, antecedentes, examen, laboratorios/imágenes clave)",
      step: "razonamiento clínico de 2 pasos (p. ej., viñeta → diagnóstico → mejor prueba inicial)",
      options: "5 opciones (A-E) con distractores clínicos realistas",
      clues: "3-4", phrases: "3-4",
    },
    hard: {
      vignette: "5 a 8 oraciones con matices clínicos sutiles, datos de laboratorio adicionales y posibles señuelos (red herrings)",
      step: "razonamiento de alto rendimiento de 3 pasos (p. ej., viñeta → diagnóstico → fisiopatología del mecanismo del tratamiento)",
      options: "5 opciones (A-E) con diferenciales muy cercanos que exigen discriminadores sutiles",
      clues: "4-5", phrases: "4-5",
    },
  },
};

// Difficulty section of the recipe. Returns { text, tiers, phrases } so the callers can reuse the
// tier list for the keyInfoPhrases count. Mixed lists each tier's profile and its exact question count.
function buildDifficultySection(size, difficulty, lang) {
  const P = RECIPE_PROFILES[lang === "es" ? "es" : "en"];
  const es = lang === "es";
  const tierLine = (id) => es
    ? `Viñeta: ${P[id].vignette}. Incluye ${P[id].clues} pistas clínicas distintas y de alto rendimiento. Paso cognitivo: ${P[id].step}. Opciones: ${P[id].options}, exactamente 1 correcta.`
    : `Vignette: ${P[id].vignette}. Include ${P[id].clues} distinct high-yield clinical clues. Cognitive step: ${P[id].step}. Options: ${P[id].options}, exactly 1 correct.`;
  // difficultyLabel values stay in English in both languages so the app can read them reliably.
  const pair = (id) => `difficultyLabel "${TIER_LABEL[id]}" ${es ? "con" : "with"} difficultyRating ${P.ratings[id]}`;

  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    const id = difficulty;
    const text = es
      ? `Dificultad: ${P.names[id]}. En todas las preguntas usa ${pair(id)}.\n${tierLine(id).replace(" Paso cognitivo:", "\nPaso cognitivo:").replace(" Opciones:", "\nOpciones:")}`
      : `Difficulty: ${P.names[id]}. On every question use ${pair(id)}.\n${tierLine(id).replace(" Cognitive step:", "\nCognitive step:").replace(" Options:", "\nOptions:")}`;
    return { text, tiers: [id], phrases: P[id].phrases };
  }

  const counts = mixedCounts(size);
  const tiers = ["easy", "medium", "hard"].filter((id) => counts[id] > 0);
  const countList = tiers.map((id) => `${counts[id]} ${P.names[id]}`).join(", ");
  const head = es
    ? `Dificultad: Mixta — exactamente ${countList}, intercaladas en cualquier orden, sin agrupar (el orden final lo fija el postproceso). Construye cada pregunta según su nivel y etiquétala: ${tiers.map(pair).join("; ")}.`
    : `Difficulty: Mixed — exactly ${countList}, interleaved in any order, without grouping (the final order is fixed by post-processing). Build each question to its tier and label it: ${tiers.map(pair).join("; ")}.`;
  const body = tiers.map((id) => `- ${P.names[id]}: ${tierLine(id)}`).join("\n");
  const phrases = tiers.length === 1 ? P[tiers[0]].phrases : tiers.map((id) => `${P[id].phrases} (${P.names[id]})`).join(", ");
  return { text: `${head}\n${body}`, tiers, phrases };
}

// Easy blocks use shorter vignettes, so they get a tighter default clock (1 min/question vs 1.5).
function recipeTimeLimit(size, difficulty) {
  return Math.max(1, Math.round(size * (difficulty === "easy" ? 1 : 1.5)));
}

// Compact schema used INSIDE the generated prompt (some AI tools have a
// tight input-length limit). The full, richly-annotated SCHEMA_TEXT above
// stays in the "JSON schema" reference panel for humans to read — this is a
// field-name/type skeleton only, no prose example values, to keep the copied
// prompt as short as possible while still fully specifying the shape.
export const PROMPT_SCHEMA_TEXT = `{"examTitle":"string","blocks":[{"blockName":"string","timeLimitMinutes":number,"questions":[{"id":"unique string","subject":"organ system/discipline","difficultyRating":number,"difficultyLabel":"Easy|Medium|Hard","questionFormat":"Vignette|Basic","recallType":"fact|mechanism|causal|identify|pathway|value|principle (Basic only, omit for Vignette)","vignette":"string","keyInfoPhrases":["string"],"stem":"string","options":[{"key":"A","text":"string"}],"correctAnswer":"matching key","attendingTip":"string","explanation":"string","keyLearningPoint":"string","distractorAnalysis":{"key":"string"},"hint":"string","educationalObjective":"string","sourceReferences":[{"sourceTitle":"string","chapterSection":"string","pageNumber":"string (optional)","relevance":"string"}],"keyInfoProvenance":[{"sourceIndex":0,"basis":"textbook|inferred|unattributed"}],"variants":[{"vignette":"string","keyInfoPhrases":["string"],"stem":"string","options":[{"key":"A","text":"string"}],"correctAnswer":"matching key","attendingTip":"string","explanation":"string","keyLearningPoint":"string","distractorAnalysis":{"key":"string"},"hint":"string"}]}]}]}`;

const MIX_VIGNETTE_PCT = 70; // Mixed question style: 70% Vignette / 30% Basic
export function mixedFormatCounts(size) {
  const basic = size >= 2 ? Math.max(1, Math.round(size * (100 - MIX_VIGNETTE_PCT) / 100)) : 0;
  return { vignette: size - basic, basic };
}

const BASIC_FORMAT_NOTE = {
  en: {
    fact: `FACT. Every question asks for one discrete fact: a definition, classification, name, characteristic, association or standard recommendation (term to attribute, or the reverse). Ask for exactly one fact in "stem". All options in a question are the same kind of answer.`,
    mechanism: `MECHANISM. Every question asks how something works: the mechanism of action of a drug, toxin or molecule, the way a structure or process operates, or the molecular or cellular event behind an effect. Name the agent or process in "vignette" and ask for its mechanism in "stem" (or describe the mechanism and ask which agent or process it is). All options are the same kind of answer (all mechanisms or all agents).`,
    causal: `CAUSE AND EFFECT. Every question asks what causes or follows from something: the cause or risk factor of a condition, the consequence or complication of a defect or exposure, or what changes downstream when one factor changes. Name the cause (or the effect) in "vignette" and ask for the link in "stem". All options are the same kind of answer (all causes or all effects).`,
    identify: `IDENTIFY. Every question describes one or more distinguishing features and asks for the thing they identify: an organism, drug, structure, cell, molecule, condition or finding. Put the identifying features in "vignette" with no patient case, and ask which of the options is described in "stem". All options are the same kind of answer (candidates from the same category).`,
    pathway: `PATHWAY AND SEQUENCE. Every question tests an ordered process: a biochemical or signaling pathway, a sequence of events, a route of flow or conduction, an embryologic or developmental order, or a rate-limiting step. Ask for the next step, the missing step, the order, or the enzyme or structure at a named step. All options are the same kind of answer (all steps or all components of the same pathway).`,
    value: `VALUE. Every question asks for a number or a direction: a normal range, a threshold or cutoff, a typical magnitude, or the direction of change (increase, decrease or no change) in a named variable when another one changes. Give quantities as numbers with units in the options where possible. All options are the same kind of answer (all numbers with the same unit, or all directions of change).`,
    principle: `PRINCIPLE. Every question tests a general rule or concept rather than one named fact: a physiologic law, a pharmacokinetic or statistical principle, an ethical or professionalism rule, a study-design concept, or a general reasoning rule. State the situation abstractly in "vignette" (no patient case) and ask which principle applies, or what follows from it, in "stem". All options are the same kind of answer.`,
  },
  es: {
    fact: `DATO. Cada pregunta pide un dato puntual: una definición, clasificación, nombre, característica, asociación o recomendación estándar (del término al atributo, o a la inversa). Pide exactamente un dato en "stem". Todas las opciones de una pregunta son del mismo tipo de respuesta.`,
    mechanism: `MECANISMO. Cada pregunta pide cómo funciona algo: el mecanismo de acción de un fármaco, toxina o molécula, la manera en que opera una estructura o un proceso, o el evento molecular o celular detrás de un efecto. Nombra el agente o proceso en "vignette" y pide su mecanismo en "stem" (o describe el mecanismo y pide cuál es el agente o proceso). Todas las opciones son del mismo tipo de respuesta (todos mecanismos o todos agentes).`,
    causal: `CAUSA Y EFECTO. Cada pregunta pide qué causa algo o qué se deriva de ello: la causa o el factor de riesgo de una condición, la consecuencia o complicación de un defecto o una exposición, o qué cambia a continuación cuando cambia un factor. Nombra la causa (o el efecto) en "vignette" y pide el vínculo en "stem". Todas las opciones son del mismo tipo de respuesta (todas causas o todos efectos).`,
    identify: `IDENTIFICAR. Cada pregunta describe una o más características distintivas y pide lo que identifican: un microorganismo, fármaco, estructura, célula, molécula, condición o hallazgo. Pon las características en "vignette" sin caso de paciente y pregunta en "stem" cuál de las opciones se describe. Todas las opciones son del mismo tipo de respuesta (candidatos de la misma categoría).`,
    pathway: `VÍA Y SECUENCIA. Cada pregunta evalúa un proceso ordenado: una vía bioquímica o de señalización, una secuencia de eventos, una ruta de flujo o conducción, un orden embriológico o del desarrollo, o un paso limitante. Pide el siguiente paso, el paso faltante, el orden, o la enzima o estructura en un paso indicado. Todas las opciones son del mismo tipo de respuesta (todos pasos o todos componentes de la misma vía).`,
    value: `VALOR. Cada pregunta pide un número o una dirección: un rango normal, un umbral o punto de corte, una magnitud típica, o el sentido del cambio (aumenta, disminuye o no cambia) en una variable cuando otra cambia. Da las cantidades como números con unidades en las opciones cuando sea posible. Todas las opciones son del mismo tipo de respuesta (todos números con la misma unidad, o todos sentidos de cambio).`,
    principle: `PRINCIPIO. Cada pregunta evalúa una regla o concepto general y no un dato concreto: una ley fisiológica, un principio farmacocinético o estadístico, una norma ética o de profesionalismo, un concepto de diseño de estudios, o una regla general de razonamiento. Plantea la situación de forma abstracta en "vignette" (sin caso de paciente) y pregunta en "stem" qué principio aplica o qué se deriva de él. Todas las opciones son del mismo tipo de respuesta.`,
  },
};
const BASIC_MIXED_NOTE = {
  en: "Recall types: MIXED. Spread the block across these types and never ask the same type more than twice in a row: fact; mechanism; cause and effect; identify; pathway and sequence; value; principle. All options within one question must be the same kind of answer.",
  es: "Tipos de recuerdo: MIXTO. Reparte el bloque entre estos tipos y nunca pidas el mismo tipo más de dos veces seguidas: dato; mecanismo; causa y efecto; identificar; vía y secuencia; valor; principio. Todas las opciones de una misma pregunta deben ser del mismo tipo de respuesta.",
};
function basicFormatNote(lang, format) {
  const l = lang === "es" ? "es" : "en";
  const body = format === "mixed" || !BASIC_FORMAT_NOTE[l][format] ? BASIC_MIXED_NOTE[l] : (l === "es" ? "Formato de recuerdo: " : "Recall format: ") + BASIC_FORMAT_NOTE[l][format] +
    (l === "es" ? " Todas las preguntas de este bloque usan este mismo formato, y cada variante conserva ese formato." : " Every question in this block uses this same format, and each variant keeps the same format.");
  return body;
}

// Basic difficulty = how deep the recall goes and how close the distractors are (never case complexity).
const BASIC_PROFILES = {
  en: {
    easy: { q: "1 plain sentence naming one classic, well-known fact", step: "direct recall of a single fact", options: "3-4 options (A-D at most) with distinct, non-overlapping distractors", phrases: "1" },
    medium: { q: "1-2 plain sentences", step: "recall plus one link (e.g. drug to class to mechanism)", options: "5 options (A-E) with plausible distractors from the same category", phrases: "1-2" },
    hard: { q: "1-2 plain sentences naming a less common agent or entity, or an exception", step: "recall of a specific, often-confused detail that needs a subtle discriminator", options: "5 options (A-E) with closely related distractors from the same category", phrases: "1-2" },
  },
  es: {
    easy: { q: "1 oración sencilla que nombre un dato clásico y muy conocido", step: "recuerdo directo de un solo dato", options: "3 a 4 opciones (como máximo A-D) con distractores distintos que no se solapen", phrases: "1" },
    medium: { q: "1 a 2 oraciones sencillas", step: "recuerdo más un vínculo (p. ej., fármaco a clase a mecanismo)", options: "5 opciones (A-E) con distractores verosímiles de la misma categoría", phrases: "1-2" },
    hard: { q: "1 a 2 oraciones sencillas que nombren un agente o entidad poco común, o una excepción", step: "recuerdo de un detalle específico y a menudo confundido que exige un discriminador sutil", options: "5 opciones (A-E) con distractores muy cercanos de la misma categoría", phrases: "1-2" },
  },
};
function buildBasicDifficulty(size, difficulty, lang) {
  const es = lang === "es";
  const P = RECIPE_PROFILES[es ? "es" : "en"];
  const B = BASIC_PROFILES[es ? "es" : "en"];
  const tierLine = (id) => es
    ? `Pregunta: ${B[id].q}. Paso cognitivo: ${B[id].step}. Opciones: ${B[id].options}, exactamente 1 correcta.`
    : `Question: ${B[id].q}. Cognitive step: ${B[id].step}. Options: ${B[id].options}, exactly 1 correct.`;
  const pair = (id) => `difficultyLabel "${TIER_LABEL[id]}" ${es ? "con" : "with"} difficultyRating ${P.ratings[id]}`;
  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    const id = difficulty;
    return { text: `${es ? "Dificultad" : "Difficulty"}: ${P.names[id]}. ${es ? "En todas las preguntas usa" : "On every question use"} ${pair(id)}.\n${tierLine(id)}`, phrases: B[id].phrases };
  }
  const counts = mixedCounts(size);
  const tiers = ["easy", "medium", "hard"].filter((id) => counts[id] > 0);
  const countList = tiers.map((id) => `${counts[id]} ${P.names[id]}`).join(", ");
  const head = es
    ? `Dificultad: Mixta — exactamente ${countList}, intercaladas en cualquier orden, sin agrupar (el orden final lo fija el postproceso). Construye cada pregunta según su nivel y etiquétala: ${tiers.map(pair).join("; ")}.`
    : `Difficulty: Mixed — exactly ${countList}, interleaved in any order, without grouping (the final order is fixed by post-processing). Build each question to its tier and label it: ${tiers.map(pair).join("; ")}.`;
  return { text: `${head}\n${tiers.map((id) => `- ${P.names[id]}: ${tierLine(id)}`).join("\n")}`, phrases: tiers.length === 1 ? B[tiers[0]].phrases : "1-2" };
}

// The dedicated Basic prompt: a different body from the vignette prompt (not the vignette prompt with a note stuck on the end).
export function buildBasicRecipe({ size, focusMode, focusValue, lang, difficulty = "mixed", basicFormat = "mixed" }) {
  const es = lang === "es";
  const baseName = es
    ? (focusMode === "systems" && focusValue ? `Bloque de sistema ${focusValue}` : focusMode === "discipline" && focusValue ? `Bloque de ${focusValue}` : "Bloque mixto")
    : (focusMode === "systems" && focusValue ? `${focusValue} System Block` : focusMode === "discipline" && focusValue ? `${focusValue} Block` : "Mixed Block");
  const blockName = difficulty === "mixed" ? baseName : `${baseName} (${RECIPE_PROFILES[es ? "es" : "en"].names[difficulty]})`;
  const timeLimit = recipeTimeLimit(size, "easy"); // basic recall questions get the faster 1 min/question clock
  const diff = buildBasicDifficulty(size, difficulty, lang);
  const fmt = basicFormatNote(lang, basicFormat);
  if (es) {
    const focusLine = focusMode === "systems" ? `Todas las preguntas de un solo sistema — ${focusValue || "[SISTEMA]"}. Varía la disciplina evaluada.`
      : focusMode === "discipline" ? `Todas las preguntas de una sola disciplina — ${focusValue || "[DISCIPLINA]"}. Varía el sistema evaluado.`
      : "usa los subjects asignados en {SLOT_PLAN} si se proporcionan; si no, elige 5 sistemas distintos y no repitas el mismo en preguntas consecutivas";
    return `Genera ${size} preguntas BÁSICAS de recuerdo directo estilo USMLE (SIN viñetas clínicas) como ÚNICAMENTE JSON válido (sin markdown ni comentarios), con este esquema (los nombres de los campos van en inglés, exactamente como se muestran):
${PROMPT_SCHEMA_TEXT}

Escribe TODO el contenido (preguntas, opciones, explicaciones, pistas, etc.) en español.
Bloque: "${blockName}", timeLimitMinutes ${timeLimit}.
${diff.text}
Estilo de pregunta: BÁSICO. Cada pregunta evalúa UN solo dato o concepto de forma directa. NO escribas un caso de paciente, historia, examen, signos vitales ni laboratorios. Pon la pregunta completa en "vignette" como oración(es) sencilla(s) (extensión según el nivel de dificultad) y usa "stem" para la línea corta de la pregunta (p. ej. "¿Cuál de los siguientes es el mecanismo de acción?"); nunca repitas la misma oración en ambos.
${fmt}
questionFormat: "Basic" en todas las preguntas. recallType: el tipo de recuerdo evaluado, exactamente uno de fact, mechanism, causal, identify, pathway, value, principle.
keyInfoPhrases: extrae ${diff.phrases} (cópialas carácter por carácter, con los mismos acentos, espacios, mayúsculas y puntuación; escribe primero la viñeta completa y luego copia las frases desde ella, nunca desde la viñeta de otra versión) que nombren el/los término(s) clave, para el resaltado inteligente.
attendingTip: ancla de memoria en 1-2 oraciones, como la de un médico adjunto docente (regla mnemotécnica, lógica o asociación clásica) que ayude a dominar el dato.
explanation: 2-4 oraciones que expliquen por qué la opción correcta es la correcta.
keyLearningPoint: conclusión de alto rendimiento en 1 oración.
distractorAnalysis: 1 oración concisa por opción incorrecta que explique por qué es incorrecta y de qué es realmente cierta.
En attendingTip, explanation, distractorAnalysis y hint nunca te refieras a una opción por su letra ("la opción C", "A y B"); nómbrala por su contenido. Prohibido "todas/ninguna de las anteriores" y opciones que combinen letras.
hint: 1 oración corta que señale la categoría o la lógica sin revelar la respuesta.
educationalObjective: 1 oración que nombre el dato evaluado.
sourceReferences: 1-3 fuentes reales (First Aid, BRS, Pathoma, etc.) — sourceTitle, chapterSection, omite pageNumber siempre (los números de página recordados de memoria no son fiables; el sistema los agrega si puede verificarlos), relevance.
keyInfoProvenance: arreglo paralelo a keyInfoPhrases (misma longitud y orden). Cada elemento: {sourceIndex, basis}. sourceIndex es la posición (desde 0) en sourceReferences de la fuente que respalda esa frase; basis es "textbook" si la fuente lo enuncia, "inferred" si lo deduces de ella, "unattributed" si ninguna fuente aplica (entonces sourceIndex es null). No inventes fuentes. Los valores de basis permanecen en inglés.
variants: EXACTAMENTE 2 por pregunta, como arreglo [variante1, variante2], para repetición espaciada. Todo lo anterior es la versión PRIMARIA; cada variante vuelve a preguntar el MISMO dato (el mismo educationalObjective) desde otro ángulo, con redacción nueva, para que no se pueda acertar recordando la redacción ni la posición de la respuesta:
- Sin pacientes. Cambia el ángulo (p. ej. la primaria pide el fármaco, la variante 1 su mecanismo, la variante 2 su efecto adverso) sin añadir un tema nuevo.
- Escribe un conjunto nuevo de opciones (distractores nuevos, no solo reordenados) con el mismo número de opciones que la primaria, y coloca correctAnswer en una letra distinta en cada una de las tres versiones.
- Mismo nivel de dificultad que la primaria. Una variante nunca debe mencionar ni hacer referencia a la primaria ni a la otra variante.
- Cada variante tiene lo suyo: vignette, keyInfoPhrases (subcadenas exactas de la viñeta DE ESA variante), stem, options, correctAnswer, attendingTip, explanation, keyLearningPoint, distractorAnalysis, hint. NO incluyas id, subject, dificultad, questionFormat, recallType, educationalObjective, sourceReferences, keyInfoProvenance ni validation dentro de una variante (se heredan de la pregunta).
subject: sistema/disciplina específica. id: único en esta respuesta, con el prefijo {ID_PREFIX} si se proporciona (p. ej., "MIX-001"). difficultyRating: entero de 1 a 5, acorde con el nivel de dificultad indicado. difficultyLabel: exactamente "Easy", "Medium" o "Hard" (en inglés), coherente con difficultyRating. Reparte correctAnswer sin patrón predecible entre las letras usadas (el equilibrio global lo corrige un postproceso); nunca la misma letra más de dos veces seguidas.
Enfoque: ${focusLine}
NO incluyas schemaVersion ni validation en ningún nivel; los agrega el sistema.
Si no puedes cumplir una regla opcional (fuente específica), omite ese dato o usa basis "unattributed". Nunca omitas campos obligatorios ni cambies sus nombres.`;
  }
  const focusLine = focusMode === "systems" ? `All questions from one organ system — ${focusValue || "[SYSTEM]"}. Vary discipline tested (anatomy/physio/path/pharm/micro).`
    : focusMode === "discipline" ? `All questions from one discipline — ${focusValue || "[DISCIPLINE]"}. Vary organ system tested.`
    : "use the subjects assigned in {SLOT_PLAN} if they are provided; otherwise choose 5 distinct systems and do not repeat the same one in consecutive questions";
  return `Generate ${size} USMLE-style BASIC recall questions (direct recall, NO clinical vignettes) as ONLY valid JSON (no markdown, no commentary), matching this schema:
${PROMPT_SCHEMA_TEXT}

Block: "${blockName}", timeLimitMinutes ${timeLimit}.
${diff.text}
Question style: BASIC. Each question tests exactly ONE fact or concept directly. Do NOT write a patient case, history, exam, vitals or labs. Put the complete question in "vignette" as plain sentence(s) (length per difficulty tier) and use "stem" for the short question line (e.g. "Which of the following is the mechanism of action?"); never repeat the same sentence in both.
${fmt}
questionFormat: "Basic" on every question. recallType: the recall type tested, exactly one of fact, mechanism, causal, identify, pathway, value, principle.
keyInfoPhrases: Extract ${diff.phrases} (copy them character for character, with the same accents, spaces, capitals and punctuation; write the full vignette first, then copy the phrases from it, never from another version's vignette) naming the key term(s), for smart-highlighting.
attendingTip: 1-2 sentence memory anchor from a teaching attending (mnemonic, logic or classic association) that helps the student own the fact.
explanation: 2-4 sentences on why the correct option is right.
keyLearningPoint: 1 sentence high-yield takeaway.
distractorAnalysis: 1 concise sentence per wrong option on why it is wrong and what it is actually true of.
In attendingTip, explanation, distractorAnalysis and hint, never refer to an option by its letter ("option C", "A and B"); name it by its content. "All/none of the above" and options that combine letters are forbidden.
hint: 1 short sentence pointing at the category or logic without revealing the answer.
educationalObjective: 1 sentence naming the fact being tested.
sourceReferences: 1-3 real sources (First Aid, BRS, Pathoma, etc.) — sourceTitle, chapterSection, omit pageNumber always (page numbers remembered from memory are not reliable; the system adds them if it can verify them), relevance.
keyInfoProvenance: an array parallel to keyInfoPhrases (same length and order). Each element: {sourceIndex, basis}. sourceIndex is the 0-based position in sourceReferences of the source that supports that phrase; basis is "textbook" if the source states it, "inferred" if you derive it from that source, "unattributed" if no source applies (then sourceIndex is null). Do not invent sources. basis values stay in English.
variants: EXACTLY 2 per question, as an array [variant1, variant2], for spaced repetition. Everything above is the PRIMARY version; each variant re-asks the SAME fact (the same educationalObjective) from a different angle with new wording, so it cannot be passed by recalling the primary's wording or answer position:
- No patients. Change the angle (e.g. primary asks the drug, variant 1 its mechanism, variant 2 its adverse effect) without adding a new topic.
- Write a new option set (new distractors, not just a reorder) with the same number of options as the primary, and put correctAnswer on a different letter in each of the three versions.
- Same difficulty tier as the primary. A variant must never mention or refer to the primary or the other variant.
- Each variant has its own: vignette, keyInfoPhrases (exact substrings of THAT variant's vignette), stem, options, correctAnswer, attendingTip, explanation, keyLearningPoint, distractorAnalysis, hint. Do NOT put id, subject, difficulty, questionFormat, recallType, educationalObjective, sourceReferences, keyInfoProvenance or validation inside a variant (they are inherited from the question).
subject: specific system/discipline. id: unique in this response, with the prefix {ID_PREFIX} if one is provided (e.g. "MIX-001"). difficultyRating: integer 1 to 5, matching the difficulty tier above. difficultyLabel: exactly "Easy", "Medium" or "Hard", consistent with difficultyRating. Spread correctAnswer with no predictable pattern across the letters used (a post-process corrects the global balance); never the same letter more than twice in a row.
Focus: ${focusLine}
Do NOT include schemaVersion or validation at any level; the system adds them.
If you cannot satisfy an optional rule (a specific source), omit that detail or use basis "unattributed". Never omit required fields or change their names.`;
}

// The Mixed question style: 70% Vignette (applying) + 30% Basic (knowing), interleaved and tagged with questionFormat so Analytics can score
// the two separately and show the gap between knowing a fact and applying it.
export function buildMixedFormatRecipe({ size, focusMode, focusValue, lang, difficulty = "mixed" }) {
  const es = lang === "es";
  const P = RECIPE_PROFILES[es ? "es" : "en"];
  const B = BASIC_PROFILES[es ? "es" : "en"];
  const { vignette: nV, basic: nB } = mixedFormatCounts(size);
  const baseName = es
    ? (focusMode === "systems" && focusValue ? `Bloque de sistema ${focusValue}` : focusMode === "discipline" && focusValue ? `Bloque de ${focusValue}` : "Bloque mixto")
    : (focusMode === "systems" && focusValue ? `${focusValue} System Block` : focusMode === "discipline" && focusValue ? `${focusValue} Block` : "Mixed Block");
  const blockName = difficulty === "mixed" ? baseName : `${baseName} (${P.names[difficulty]})`;
  const timeLimit = Math.max(1, Math.round(nV * 1.5 + nB)); // Vignettes 1.5 min each, Basic recall 1 min each
  const diff = buildDifficultySection(size, difficulty, lang);
  const tiers = difficulty === "mixed" ? ["easy", "medium", "hard"] : [difficulty];
  const basicTiers = tiers.map((id) => es
    ? `- ${P.names[id]}: Pregunta: ${B[id].q}. Paso cognitivo: ${B[id].step}. Opciones: ${B[id].options}.`
    : `- ${P.names[id]}: Question: ${B[id].q}. Cognitive step: ${B[id].step}. Options: ${B[id].options}.`).join("\n");
  if (es) {
    const focusLine = focusMode === "systems" ? `Todas las preguntas de un solo sistema — ${focusValue || "[SISTEMA]"}. Varía la disciplina evaluada.`
      : focusMode === "discipline" ? `Todas las preguntas de una sola disciplina — ${focusValue || "[DISCIPLINA]"}. Varía el sistema evaluado.`
      : "usa los subjects asignados en {SLOT_PLAN} si se proporcionan; si no, elige 5 sistemas distintos y no repitas el mismo en preguntas consecutivas";
    return `Genera ${size} preguntas de práctica estilo USMLE como ÚNICAMENTE JSON válido (sin markdown ni comentarios), con este esquema (los nombres de los campos van en inglés, exactamente como se muestran):
${PROMPT_SCHEMA_TEXT}

Escribe TODO el contenido (viñetas, opciones, explicaciones, pistas, etc.) en español.
Bloque: "${blockName}", timeLimitMinutes ${timeLimit}.
Mezcla de formatos (70% Vignette / 30% Basic): exactamente ${nV} preguntas Vignette y ${nB} Basic, intercaladas en orden aleatorio (nunca más de 3 seguidas del mismo formato). Etiqueta cada pregunta con questionFormat "Vignette" o "Basic": esa etiqueta sirve para puntuar por separado el saber (Basic) y el aplicar (Vignette), así que debe coincidir con la pregunta que realmente escribiste. Cuando el bloque lo permita, cubre las mismas materias en ambos formatos para poder comparar las dos puntuaciones por materia.
${diff.text}
Los perfiles de arriba describen las preguntas Vignette. Las preguntas Basic usan el mismo difficultyLabel y difficultyRating, pero siguen esta forma:
${basicTiers}
Preguntas VIGNETTE (questionFormat "Vignette"): un caso clínico completo en "vignette" (edad/sexo, presentación, historia, examen, datos según el perfil del nivel) y una línea de pregunta en "stem". keyInfoPhrases: ${diff.phrases} (cópialas carácter por carácter, con los mismos acentos, espacios, mayúsculas y puntuación; escribe primero la viñeta completa y luego copia las frases desde ella, nunca desde la viñeta de otra versión).
Preguntas BASIC (questionFormat "Basic"): recuerdo directo de UN solo dato, SIN caso de paciente, historia, examen, signos vitales ni laboratorios. Pon la pregunta completa en "vignette" como oración(es) sencilla(s) y una línea corta de pregunta en "stem" (nunca repitas la misma oración en ambos). Asigna recallType según el recuerdo evaluado: fact, mechanism, causal, identify, pathway, value o principle, repartidos entre estos tipos. Todas las opciones de una pregunta son del mismo tipo de respuesta. keyInfoPhrases: 1-2 (cópialas carácter por carácter, con los mismos acentos, espacios, mayúsculas y puntuación; escribe primero la viñeta completa y luego copia las frases desde ella, nunca desde la viñeta de otra versión) que nombren el/los término(s) clave.
attendingTip: 1-2 oraciones (Vignette: razonamiento clínico de un médico adjunto; Basic: ancla de memoria como una regla mnemotécnica o asociación clásica). explanation: 3-5 oraciones en Vignette y 2-4 en Basic sobre por qué la opción correcta es la correcta. keyLearningPoint: conclusión de alto rendimiento en 1-2 oraciones. distractorAnalysis: 1 oración concisa por opción incorrecta que explique por qué es incorrecta y de qué es realmente cierta. En attendingTip, explanation, distractorAnalysis y hint nunca te refieras a una opción por su letra ("la opción C", "A y B"); nómbrala por su contenido. Prohibido "todas/ninguna de las anteriores" y opciones que combinen letras. hint: 1 oración corta que señale la lógica sin revelar la respuesta. educationalObjective: resumen en 1-2 oraciones del concepto o dato evaluado. sourceReferences: 1-3 fuentes reales (First Aid, BRS, Pathoma, etc.) — sourceTitle, chapterSection, omite pageNumber siempre (los números de página recordados de memoria no son fiables; el sistema los agrega si puede verificarlos), relevance.
keyInfoProvenance: arreglo paralelo a keyInfoPhrases (misma longitud y orden). Cada elemento: {sourceIndex, basis}. sourceIndex es la posición (desde 0) en sourceReferences de la fuente que respalda esa frase; basis es "textbook" si la fuente lo enuncia, "inferred" si lo deduces de ella, "unattributed" si ninguna fuente aplica (entonces sourceIndex es null). No inventes fuentes. Los valores de basis permanecen en inglés.
variants: EXACTAMENTE 2 por pregunta, como arreglo [variante1, variante2], para repetición espaciada. Todo lo anterior es la versión PRIMARIA; cada variante vuelve a evaluar el MISMO educationalObjective en el MISMO formato que su primaria (las variantes de una Vignette son Vignette y las de una Basic son Basic), con redacción nueva para que no se pueda acertar recordando la redacción ni la posición de la respuesta:
- Vignette: cambia al paciente y las pistas de presentación conservando el/los hallazgo(s) decisivo(s), y cambia el enfoque (diagnóstico, mecanismo o siguiente paso, tratamiento, complicación) sin añadir un tema nuevo. Basic: sin pacientes; cambia el enfoque (p. ej. el fármaco, luego su mecanismo, luego su efecto adverso) sin añadir un tema nuevo.
- Escribe un conjunto nuevo de opciones (distractores nuevos, no solo reordenados) con el mismo número de opciones que la primaria, y coloca correctAnswer en una letra distinta en cada una de las tres versiones.
- Mismo nivel de dificultad que la primaria. Una variante nunca debe mencionar ni hacer referencia a la primaria ni a la otra variante.
- Cada variante tiene lo suyo: vignette, keyInfoPhrases (subcadenas exactas de la viñeta DE ESA variante), stem, options, correctAnswer, attendingTip, explanation, keyLearningPoint, distractorAnalysis, hint. NO incluyas id, subject, dificultad, questionFormat, recallType, educationalObjective, sourceReferences, keyInfoProvenance ni validation dentro de una variante (se heredan de la pregunta).
subject: sistema/disciplina específica. id: único en esta respuesta, con el prefijo {ID_PREFIX} si se proporciona (p. ej., "MIX-001"). difficultyRating: entero de 1 a 5, acorde con el nivel de dificultad indicado. difficultyLabel: exactamente "Easy", "Medium" o "Hard" (en inglés), coherente con difficultyRating. Reparte correctAnswer sin patrón predecible entre las letras usadas (el equilibrio global lo corrige un postproceso); nunca la misma letra más de dos veces seguidas.
Enfoque: ${focusLine}
NO incluyas schemaVersion ni validation en ningún nivel; los agrega el sistema.
Si no puedes cumplir una regla opcional (fuente específica), omite ese dato o usa basis "unattributed". Nunca omitas campos obligatorios ni cambies sus nombres.`;
  }
  const focusLine = focusMode === "systems" ? `All questions from one organ system — ${focusValue || "[SYSTEM]"}. Vary discipline tested (anatomy/physio/path/pharm/micro).`
    : focusMode === "discipline" ? `All questions from one discipline — ${focusValue || "[DISCIPLINE]"}. Vary organ system tested.`
    : "use the subjects assigned in {SLOT_PLAN} if they are provided; otherwise choose 5 distinct systems and do not repeat the same one in consecutive questions";
  return `Generate ${size} USMLE-style practice questions as ONLY valid JSON (no markdown, no commentary), matching this schema:
${PROMPT_SCHEMA_TEXT}

Block: "${blockName}", timeLimitMinutes ${timeLimit}.
Format mix (70% Vignette / 30% Basic): exactly ${nV} Vignette and ${nB} Basic questions, interleaved in random order (never more than 3 of the same format in a row). Tag every question with questionFormat "Vignette" or "Basic": the tag is used to score knowing (Basic) and applying (Vignette) separately, so it must match the question you actually wrote. Where the block allows, cover the same subjects in both formats so the two scores can be compared by subject.
${diff.text}
The tier profiles above describe the Vignette questions. Basic questions use the same difficultyLabel and difficultyRating but follow this shape:
${basicTiers}
VIGNETTE questions (questionFormat "Vignette"): a full patient case in "vignette" (age/sex, presentation, history, exam, data as the tier profile says) and a one-line question in "stem". keyInfoPhrases: ${diff.phrases} (copy them character for character, with the same accents, spaces, capitals and punctuation; write the full vignette first, then copy the phrases from it, never from another version's vignette).
BASIC questions (questionFormat "Basic"): direct recall of ONE fact with NO patient case, history, exam, vitals or labs. Put the whole question in "vignette" as plain sentence(s) and a short question line in "stem" (never repeat the same sentence in both). Set recallType to the kind of recall tested: fact, mechanism, causal, identify, pathway, value or principle, spread across these types. All options in a question are the same kind of answer. keyInfoPhrases: 1-2 (copy them character for character, with the same accents, spaces, capitals and punctuation; write the full vignette first, then copy the phrases from it, never from another version's vignette) naming the key term(s).
attendingTip: 1-2 sentences (Vignette: clinical reasoning from an attending; Basic: a memory anchor such as a mnemonic or classic association). explanation: 3-5 sentences for Vignette and 2-4 for Basic on why the correct option is right. keyLearningPoint: 1-2 sentence high-yield takeaway. distractorAnalysis: 1 concise sentence per wrong option on why it is wrong and what it is actually true of. In attendingTip, explanation, distractorAnalysis and hint, never refer to an option by its letter ("option C", "A and B"); name it by its content. "All/none of the above" and options that combine letters are forbidden. hint: 1 short sentence pointing at the logic without revealing the answer. educationalObjective: 1-2 sentence summary of the concept or fact tested. sourceReferences: 1-3 real sources (First Aid, BRS, Pathoma, etc.) — sourceTitle, chapterSection, omit pageNumber always (page numbers remembered from memory are not reliable; the system adds them if it can verify them), relevance.
keyInfoProvenance: an array parallel to keyInfoPhrases (same length and order). Each element: {sourceIndex, basis}. sourceIndex is the 0-based position in sourceReferences of the source that supports that phrase; basis is "textbook" if the source states it, "inferred" if you derive it from that source, "unattributed" if no source applies (then sourceIndex is null). Do not invent sources. basis values stay in English.
variants: EXACTLY 2 per question, as an array [variant1, variant2], for spaced repetition. Everything above is the PRIMARY version; each variant re-tests the SAME educationalObjective in the SAME format as its primary (a Vignette's variants are Vignettes, a Basic's variants are Basic), with new wording so it cannot be passed by recalling the primary's wording or answer position:
- Vignette: change the patient and presenting clues while keeping the decisive finding(s), and change the angle (diagnosis, mechanism or next step, treatment, complication) without adding a new topic. Basic: no patients; change the angle (e.g. the drug, then its mechanism, then its adverse effect) without adding a new topic.
- Write a new option set (new distractors, not just a reorder) with the same number of options as the primary, and put correctAnswer on a different letter in each of the three versions.
- Same difficulty tier as the primary. A variant must never mention or refer to the primary or the other variant.
- Each variant has its own: vignette, keyInfoPhrases (exact substrings of THAT variant's vignette), stem, options, correctAnswer, attendingTip, explanation, keyLearningPoint, distractorAnalysis, hint. Do NOT put id, subject, difficulty, questionFormat, recallType, educationalObjective, sourceReferences, keyInfoProvenance or validation inside a variant (they are inherited from the question).
subject: specific system/discipline. id: unique in this response, with the prefix {ID_PREFIX} if one is provided (e.g. "MIX-001"). difficultyRating: integer 1 to 5, matching the difficulty tier above. difficultyLabel: exactly "Easy", "Medium" or "Hard", consistent with difficultyRating. Spread correctAnswer with no predictable pattern across the letters used (a post-process corrects the global balance); never the same letter more than twice in a row.
Focus: ${focusLine}
Do NOT include schemaVersion or validation at any level; the system adds them.
If you cannot satisfy an optional rule (a specific source), omit that detail or use basis "unattributed". Never omit required fields or change their names.`;
}

// Focus = Balanced (standard) | Focused system | Focused discipline, plus "Topics this week" for either focused choice. Topics only, with no
// system or discipline picked, behave like a Balanced block weighted toward those topics.
export function buildQuestionRecipe({ size, focusMode, focusValue, focusTopics = "", lang, difficulty = "mixed", style = "vignette", basicFormat = "mixed" }) {
  const topics = focusMode !== "standard" ? String(focusTopics || "").trim() : "";
  const mode = topics && !String(focusValue || "").trim() ? "standard" : focusMode;
  const text = buildQuestionRecipeBase({ size, focusMode: mode, focusValue, lang, difficulty, style, basicFormat });
  if (!topics) return text;
  return text + (lang === "es"
    ? `\nTemas: ${topics}. Concentra las preguntas en estos temas, repartidas entre ellos, y cubre cada uno al menos una vez cuando el tamaño del bloque lo permita.`
    : `\nTopics: ${topics}. Concentrate the questions on these topics, spread across them, and cover each at least once where the block size allows.`);
}
export function buildQuestionRecipeBase({ size, focusMode, focusValue, lang, difficulty = "mixed", style = "vignette", basicFormat = "mixed" }) {
  if (style === "mixed") return buildMixedFormatRecipe({ size, focusMode, focusValue, lang, difficulty });
  if (style === "basic") return buildBasicRecipe({ size, focusMode, focusValue, lang, difficulty, basicFormat });
  if (lang === "es") return buildQuestionRecipeEs({ size, focusMode, focusValue, difficulty, style });
  const baseName =
    focusMode === "systems" && focusValue ? `${focusValue} System Block`
    : focusMode === "discipline" && focusValue ? `${focusValue} Block`
    : "Mixed Block";
  const blockName = difficulty === "mixed" ? baseName : `${baseName} (${RECIPE_PROFILES.en.names[difficulty]})`;
  const timeLimit = recipeTimeLimit(size, difficulty); // basic recall questions get the faster 1 min/question clock
  const diff = buildDifficultySection(size, difficulty, "en");

  let focusLine;
  if (focusMode === "systems") {
    focusLine = `All questions from one organ system — ${focusValue || "[SYSTEM]"}. Vary discipline tested (anatomy/physio/path/pharm/micro).`;
  } else if (focusMode === "discipline") {
    focusLine = `All questions from one discipline — ${focusValue || "[DISCIPLINE]"}. Vary organ system tested.`;
  } else {
    focusLine = `use the subjects assigned in {SLOT_PLAN} if they are provided; otherwise choose 5 distinct systems and do not repeat the same one in consecutive questions`;
  }

  return `Generate ${size} USMLE-style practice questions as ONLY valid JSON (no markdown, no commentary), matching this schema:
${PROMPT_SCHEMA_TEXT}

Block: "${blockName}", timeLimitMinutes ${timeLimit}.
${diff.text}
questionFormat: "Vignette" on every question (omit recallType).
keyInfoPhrases: Extract ${diff.phrases} (copy them character for character, with the same accents, spaces, capitals and punctuation; write the full vignette first, then copy the phrases from it, never from another version's vignette) for smart-highlighting.
attendingTip: 1-2 sentence clinical reasoning breakdown written from the perspective of an attending physician guiding a student to the diagnosis.
explanation: 3-5 sentences analyzing why the correct option is right.
keyLearningPoint: 1-2 sentence high-yield takeaway summarizing the pathology/management.
distractorAnalysis: 1 concise sentence per wrong option explaining why it is incorrect and what condition it would typically point to.
In attendingTip, explanation, distractorAnalysis and hint, never refer to an option by its letter ("option C", "A and B"); name it by its content. "All/none of the above" and options that combine letters are forbidden.
hint: 1 short sentence guiding attention to the core abnormality without revealing the answer.
educationalObjective: 1-2 sentence core concept summary.
sourceReferences: 1-3 real sources (First Aid, BRS, Pathoma, etc.) — sourceTitle, chapterSection, omit pageNumber always (page numbers remembered from memory are not reliable; the system adds them if it can verify them), relevance.
keyInfoProvenance: an array parallel to keyInfoPhrases (same length and order). Each element: {sourceIndex, basis}. sourceIndex is the 0-based position in sourceReferences of the source that supports that phrase; basis is "textbook" if the source states it, "inferred" if you derive it from that source, "unattributed" if no source applies (then sourceIndex is null). Do not invent sources. basis values stay in English.
variants: EXACTLY 2 per question, as an array [variant1, variant2], for spaced repetition. Everything above is the PRIMARY version; each variant re-tests the SAME educationalObjective and the SAME core diagnosis/mechanism/management, but must look different so it cannot be passed by recalling the primary's wording or answer position:
- Change the patient (age, sex, setting, history details) and the presenting clues, while keeping the same decisive finding(s) that lead to the answer.
- Change the angle of the question across the three versions (for example: primary asks the diagnosis, variant 1 the mechanism or next best step, variant 2 the treatment, complication or expected lab/imaging finding). Every version must still hinge on the same concept; never add a new topic.
- Write a new option set (new distractors, not just a reorder) with the same number of options as the primary, and put correctAnswer on a different letter in each of the three versions.
- Same difficulty tier as the primary. A variant must never mention or refer to the primary or the other variant.
- Each variant has its own: vignette, keyInfoPhrases (exact substrings of THAT variant's vignette), stem, options, correctAnswer, attendingTip, explanation, keyLearningPoint, distractorAnalysis, hint, all written fresh and following the same length rules as the primary. Do NOT put id, subject, difficulty, questionFormat, recallType, educationalObjective, sourceReferences, keyInfoProvenance or validation inside a variant (they are inherited from the question).
subject: specific system/discipline. id: unique in this response, with the prefix {ID_PREFIX} if one is provided (e.g. "MIX-001"). difficultyRating: integer 1 to 5, matching the difficulty tier above. difficultyLabel: exactly "Easy", "Medium" or "Hard", consistent with difficultyRating. Spread correctAnswer with no predictable pattern across the letters used (a post-process corrects the global balance); never the same letter more than twice in a row.
Focus: ${focusLine}
Do NOT include schemaVersion or validation at any level; the system adds them.
If you cannot satisfy an optional rule (a specific source), omit that detail or use basis "unattributed". Never omit required fields or change their names.`;
}

export function buildQuestionRecipeEs({ size, focusMode, focusValue, difficulty = "mixed", style = "vignette" }) {
  const baseName =
    focusMode === "systems" && focusValue ? `Bloque de sistema ${focusValue}`
    : focusMode === "discipline" && focusValue ? `Bloque de ${focusValue}`
    : "Bloque mixto";
  const blockName = difficulty === "mixed" ? baseName : `${baseName} (${RECIPE_PROFILES.es.names[difficulty]})`;
  const diff = buildDifficultySection(size, difficulty, "es");
  const focusLine =
    focusMode === "systems" ? `Todas las preguntas de un solo sistema — ${focusValue || "[SISTEMA]"}. Varía la disciplina evaluada (anatomía/fisiología/patología/farmacología/microbiología).`
    : focusMode === "discipline" ? `Todas las preguntas de una sola disciplina — ${focusValue || "[DISCIPLINA]"}. Varía el sistema evaluado.`
    : "usa los subjects asignados en {SLOT_PLAN} si se proporcionan; si no, elige 5 sistemas distintos y no repitas el mismo en preguntas consecutivas";
  return `Genera ${size} preguntas de práctica estilo USMLE como ÚNICAMENTE JSON válido (sin markdown ni comentarios), con este esquema (los nombres de los campos van en inglés, exactamente como se muestran):
${PROMPT_SCHEMA_TEXT}

Escribe TODO el contenido (viñetas, opciones, explicaciones, pistas, etc.) en español.
Bloque: "${blockName}", timeLimitMinutes ${recipeTimeLimit(size, difficulty)}.
${diff.text}
questionFormat: "Vignette" en todas las preguntas (omite recallType).
keyInfoPhrases: extrae ${diff.phrases} frases diagnósticas clave, (cópialas carácter por carácter, con los mismos acentos, espacios, mayúsculas y puntuación; escribe primero la viñeta completa y luego copia las frases desde ella, nunca desde la viñeta de otra versión), para el resaltado inteligente.
attendingTip: desglose del razonamiento clínico en 1-2 oraciones, escrito desde la perspectiva de un médico adjunto que guía al estudiante hacia el diagnóstico.
explanation: 3-5 oraciones que analicen por qué la opción correcta es la correcta.
keyLearningPoint: conclusión de alto rendimiento en 1-2 oraciones que resuma la patología/el manejo.
distractorAnalysis: 1 oración concisa por opción incorrecta que explique por qué es incorrecta y a qué condición apuntaría normalmente.
En attendingTip, explanation, distractorAnalysis y hint nunca te refieras a una opción por su letra ("la opción C", "A y B"); nómbrala por su contenido. Prohibido "todas/ninguna de las anteriores" y opciones que combinen letras.
hint: 1 oración corta que dirija la atención a la anomalía central sin revelar la respuesta.
educationalObjective: resumen del concepto central en 1-2 oraciones.
sourceReferences: 1-3 fuentes reales (First Aid, BRS, Pathoma, etc.) — sourceTitle, chapterSection, omite pageNumber siempre (los números de página recordados de memoria no son fiables; el sistema los agrega si puede verificarlos), relevance.
keyInfoProvenance: arreglo paralelo a keyInfoPhrases (misma longitud y orden). Cada elemento: {sourceIndex, basis}. sourceIndex es la posición (desde 0) en sourceReferences de la fuente que respalda esa frase; basis es "textbook" si la fuente lo enuncia, "inferred" si lo deduces de ella, "unattributed" si ninguna fuente aplica (entonces sourceIndex es null). No inventes fuentes. Los valores de basis permanecen en inglés.
variants: EXACTAMENTE 2 por pregunta, como arreglo [variante1, variante2], para repetición espaciada. Todo lo anterior es la versión PRIMARIA; cada variante vuelve a evaluar el MISMO educationalObjective y el MISMO diagnóstico/mecanismo/manejo central, pero debe verse distinta para que no se pueda acertar recordando la redacción ni la posición de la respuesta de la primaria:
- Cambia al paciente (edad, sexo, contexto, detalles de la historia) y las pistas de presentación, conservando el/los hallazgo(s) decisivo(s) que llevan a la respuesta.
- Cambia el enfoque de la pregunta entre las tres versiones (por ejemplo: la primaria pregunta el diagnóstico, la variante 1 el mecanismo o el siguiente mejor paso, la variante 2 el tratamiento, la complicación o el hallazgo esperado de laboratorio/imagen). Todas deben seguir girando en torno al mismo concepto; nunca agregues un tema nuevo.
- Escribe un conjunto nuevo de opciones (distractores nuevos, no solo reordenados) con el mismo número de opciones que la primaria, y coloca correctAnswer en una letra distinta en cada una de las tres versiones.
- Mismo nivel de dificultad que la primaria. Una variante nunca debe mencionar ni hacer referencia a la primaria ni a la otra variante.
- Cada variante tiene lo suyo: vignette, keyInfoPhrases (subcadenas exactas de la viñeta DE ESA variante), stem, options, correctAnswer, attendingTip, explanation, keyLearningPoint, distractorAnalysis, hint, todo escrito de nuevo y con las mismas reglas de extensión que la primaria. NO incluyas id, subject, dificultad, questionFormat, recallType, educationalObjective, sourceReferences, keyInfoProvenance ni validation dentro de una variante (se heredan de la pregunta).
subject: sistema/disciplina específica. id: único en esta respuesta, con el prefijo {ID_PREFIX} si se proporciona (p. ej., "MIX-001"). difficultyRating: entero de 1 a 5, acorde con el nivel de dificultad indicado. difficultyLabel: exactamente "Easy", "Medium" o "Hard" (en inglés), coherente con difficultyRating. Reparte correctAnswer sin patrón predecible entre las letras usadas (el equilibrio global lo corrige un postproceso); nunca la misma letra más de dos veces seguidas.
Enfoque: ${focusLine}
NO incluyas schemaVersion ni validation en ningún nivel; los agrega el sistema.
Si no puedes cumplir una regla opcional (fuente específica), omite ese dato o usa basis "unattributed". Nunca omitas campos obligatorios ni cambies sus nombres.`;
}
