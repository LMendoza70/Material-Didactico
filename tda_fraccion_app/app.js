const state = JSON.parse(localStorage.getItem("tdaAppState") || "{}");
const saveState = () => localStorage.setItem("tdaAppState", JSON.stringify(state));
const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];
const toast = (msg) => {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2200);
};

const sections = $$(".page").map(x => x.id);
function showSection(id) {
  $$(".page").forEach(x => x.classList.toggle("active", x.id === id));
  $$(".nav-item").forEach(x => x.classList.toggle("active", x.dataset.section === id));
  state.currentSection = id;
  state.visited = [...new Set([...(state.visited || []), id])];
  saveState();
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$(".nav-item").forEach(b => b.addEventListener("click", () => showSection(b.dataset.section)));
$$(".go-next").forEach(b => b.addEventListener("click", () => showSection(b.dataset.next)));

$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  state.dark = document.body.classList.contains("dark");
  saveState();
});
if (state.dark) document.body.classList.add("dark");

$("#showOutcome").addEventListener("click", () => $("#outcomeCard").classList.toggle("hidden"));

const initial = [
  "¿Cuál es la diferencia entre un valor y las operaciones que se realizan sobre él?",
  "¿Qué problemas pueden aparecer si los atributos son públicos?",
  "¿Qué condición debe cumplir siempre una fracción válida?",
  "¿Qué responsabilidad tiene un constructor?",
  "¿Qué significa encapsular?"
];
const iq = $("#initialQuestions");
initial.forEach((q, i) => {
  const div = document.createElement("div");
  div.className = "question";
  div.innerHTML = `<strong>${i+1}. ${q}</strong><button class="secondary small">Guardar</button>
                   <input type="text" value="${state.initial?.[i] || ""}" placeholder="Tu respuesta..." />`;
  const input = div.querySelector("input");
  div.querySelector("button").onclick = () => {
    state.initial = state.initial || {};
    state.initial[i] = input.value.trim();
    saveState();
    updateInitialCounter();
    toast("Respuesta guardada");
  };
  iq.appendChild(div);
});
function updateInitialCounter() {
  const n = Object.values(state.initial || {}).filter(Boolean).length;
  $("#initialCounter").textContent = `${n}/5`;
}
updateInitialCounter();

const conceptText = {
  tda: "Describe el tipo desde el comportamiento observable, no desde la sintaxis de una clase.",
  valores: "Entidades conceptuales que pueden representarse. En Fraccion: números racionales.",
  operaciones: "Acciones válidas: crear, sumar, restar, multiplicar, dividir, comparar y convertir.",
  invariantes: "Condiciones que siempre deben cumplirse para que el objeto permanezca válido.",
  interfaz: "Constructores y métodos visibles que forman el contrato con el usuario.",
  representacion: "Datos concretos usados internamente. Deben permanecer ocultos.",
  implementacion: "Código Java que hace realidad la especificación mediante una estrategia concreta."
};
$$(".concept-node").forEach(b => b.addEventListener("click", () => {
  $("#conceptDetail").textContent = conceptText[b.dataset.concept];
}));

$("#feynmanText").value = state.feynman || "";
$("#checkFeynman").onclick = () => {
  const t = $("#feynmanText").value.trim();
  const forbidden = /\b(clase|objeto)\b/i.test(t);
  const signals = ["valor", "operacion", "regla", "ocult", "interfaz"].filter(k => t.toLowerCase().includes(k)).length;
  state.feynman = t; saveState();
  const f = $("#feynmanFeedback");
  if (t.length < 40) {
    f.textContent = "Amplía la explicación: incluye valores, operaciones y reglas.";
    f.className = "feedback bad";
  } else if (forbidden) {
    f.textContent = "Reformula sin usar “clase” ni “objeto”.";
    f.className = "feedback bad";
  } else if (signals >= 2) {
    f.textContent = "Explicación conceptualmente sólida.";
    f.className = "feedback good";
    state.feynmanComplete = true; saveState(); updateProgress();
  } else {
    f.textContent = "Añade qué representa, qué permite hacer y qué debe mantenerse.";
    f.className = "feedback";
  }
};

const invariants = [
  ["Denominador distinto de cero", "Evita representar una división indefinida."],
  ["Denominador siempre positivo", "Establece una convención única para el signo."],
  ["Fracción simplificada", "Permite una representación canónica de cada valor."],
  ["Cero representado como 0/1", "Evita múltiples representaciones del mismo cero."],
  ["Objetos inmutables", "Cada operación devuelve un nuevo valor y conserva los operandos."]
];
$("#invariants").innerHTML = invariants.map(([a,b]) => `<div class="invariant"><strong>${a}</strong><br><span>${b}</span></div>`).join("");

const classItems = [
  ["Sumar produce otra fracción equivalente a la suma matemática.", "spec"],
  ["Se utiliza el algoritmo de Euclides para calcular el MCD.", "impl"],
  ["El denominador nunca puede ser cero.", "spec"],
  ["Los datos se almacenan en dos campos de tipo int.", "impl"],
  ["Dividir entre una fracción cero lanza una excepción.", "spec"]
];
$("#classificationQuiz").innerHTML = classItems.map((x,i) => `
  <div class="classification-item">
    <span>${x[0]}</span>
    <select data-index="${i}">
      <option value="">Seleccionar</option>
      <option value="spec">Especificación</option>
      <option value="impl">Implementación</option>
    </select>
  </div>`).join("");
$("#gradeClassification").onclick = () => {
  const answers = $$("#classificationQuiz select");
  const score = answers.filter((s,i) => s.value === classItems[i][1]).length;
  const out = $("#classificationResult");
  out.textContent = `${score}/5 correctas.`;
  out.className = `feedback ${score === 5 ? "good" : "bad"}`;
  if (score === 5) { state.classificationComplete = true; saveState(); updateProgress(); }
};

const steps = [
  {
    title: "Atributos, constructor y validación",
    objective: "Impedir que nazcan objetos con denominador cero.",
    code: `public final class Fraccion {
    private final int numerador;
    private final int denominador;

    public Fraccion(int numerador, int denominador) {
        if (denominador == 0) {
            throw new IllegalArgumentException(
                "El denominador no puede ser cero"
            );
        }
        this.numerador = numerador;
        this.denominador = denominador;
    }
}`,
    question: "¿Qué ocurre con new Fraccion(5, 0)?",
    error: "Confiar en que el usuario nunca proporcionará un denominador cero."
  },
  {
    title: "Normalización y simplificación",
    objective: "Conservar una representación canónica mediante signo positivo y MCD.",
    code: `if (denominador < 0) {
    numerador = -numerador;
    denominador = -denominador;
}

int divisor = calcularMcd(
    Math.abs(numerador),
    denominador
);

this.numerador = numerador / divisor;
this.denominador = denominador / divisor;`,
    question: "¿Cómo se almacena new Fraccion(3, -6)?",
    error: "Simplificar sin normalizar antes el signo."
  },
  {
    title: "Consultas y conversión",
    objective: "Consultar el valor sin exponer estado modificable.",
    code: `public double convertirADouble() {
    return (double) numerador / denominador;
}

@Override
public String toString() {
    return denominador == 1
        ? String.valueOf(numerador)
        : numerador + "/" + denominador;
}`,
    question: "¿Por qué se necesita el cast a double?",
    error: "Usar división entera y obtener 0 para 1/2."
  },
  {
    title: "Suma y resta",
    objective: "Crear nuevos resultados sin modificar los operandos.",
    code: `public Fraccion sumar(Fraccion otra) {
    return new Fraccion(
        numerador * otra.denominador
            + otra.numerador * denominador,
        denominador * otra.denominador
    );
}`,
    question: "¿Qué valor produce 1/2 + 1/3?",
    error: "Sumar numeradores y denominadores directamente."
  },
  {
    title: "Multiplicación y división",
    objective: "Completar operaciones exactas y proteger la división entre cero.",
    code: `public Fraccion dividir(Fraccion otra) {
    if (otra.numerador == 0) {
        throw new ArithmeticException(
            "No se puede dividir entre cero"
        );
    }
    return new Fraccion(
        numerador * otra.denominador,
        denominador * otra.numerador
    );
}`,
    question: "¿Qué dato de la otra fracción indica que representa cero?",
    error: "Validar el denominador de la fracción divisora en vez de su numerador."
  },
  {
    title: "Igualdad lógica",
    objective: "Comparar valores racionales y no referencias.",
    code: `@Override
public boolean equals(Object objeto) {
    if (this == objeto) return true;
    if (!(objeto instanceof Fraccion)) return false;

    Fraccion otra = (Fraccion) objeto;
    return numerador == otra.numerador
        && denominador == otra.denominador;
}`,
    question: "¿Qué devuelve equals para 1/2 y 2/4?",
    error: "Usar == para comparar objetos."
  },
  {
    title: "Pruebas de comportamiento",
    objective: "Comprobar invariantes, exactitud e inmutabilidad.",
    code: `Fraccion a = new Fraccion(2, 4);
Fraccion b = new Fraccion(1, 4);
Fraccion suma = a.sumar(b);

System.out.println(a);
System.out.println(suma);`,
    question: "¿Qué se imprime y qué demuestra sobre la inmutabilidad?",
    error: "Probar solo casos positivos y omitir cero, negativos y excepciones."
  }
];
let currentStep = state.currentStep || 0;
$("#stepper").innerHTML = steps.map((_,i) => `<button class="step-dot" data-step="${i}">${i+1}</button>`).join("");
function renderStep() {
  const s = steps[currentStep];
  $("#stepLabel").textContent = `Incremento ${currentStep+1}`;
  $("#stepTitle").textContent = s.title;
  $("#stepObjective").textContent = s.objective;
  $("#stepCode").textContent = s.code;
  $("#stepQuestion").textContent = s.question;
  $("#stepError").textContent = s.error;
  $("#stepAnswer").value = state.predictions?.[currentStep] || "";
  $$(".step-dot").forEach((b,i) => b.classList.toggle("active", i === currentStep));
  state.currentStep = currentStep; saveState();
}
renderStep();
$$(".step-dot").forEach(b => b.onclick = () => { currentStep = +b.dataset.step; renderStep(); });
$("#prevStep").onclick = () => { currentStep = Math.max(0, currentStep-1); renderStep(); };
$("#nextStep").onclick = () => { currentStep = Math.min(steps.length-1, currentStep+1); renderStep(); };
$("#savePrediction").onclick = () => {
  state.predictions = state.predictions || {};
  state.predictions[currentStep] = $("#stepAnswer").value.trim();
  state.stepsVisited = [...new Set([...(state.stepsVisited || []), currentStep])];
  saveState(); updateProgress();
  $("#predictionFeedback").textContent = "Predicción guardada. Compárala al ejecutar el código.";
  $("#predictionFeedback").className = "feedback good";
};

function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a || 1; }
function norm(n,d){
  if(d===0) throw new Error("El denominador no puede ser cero.");
  if(d<0){n=-n;d=-d;}
  const g=gcd(n,d); return [n/g,d/g];
}
function fmt([n,d]){ return d===1 ? `${n}` : `${n}/${d}`; }
$("#calculateBtn").onclick = () => {
  try{
    const a=norm(+$("#aNum").value,+$("#aDen").value);
    const b=norm(+$("#bNum").value,+$("#bDen").value);
    let r;
    switch($("#operation").value){
      case "sum": r=norm(a[0]*b[1]+b[0]*a[1],a[1]*b[1]); break;
      case "sub": r=norm(a[0]*b[1]-b[0]*a[1],a[1]*b[1]); break;
      case "mul": r=norm(a[0]*b[0],a[1]*b[1]); break;
      case "div":
        if(b[0]===0) throw new Error("No se puede dividir entre una fracción cero.");
        r=norm(a[0]*b[1],a[1]*b[0]); break;
    }
    $("#calcResult").textContent=`Resultado: ${fmt(r)}`;
    state.labUsed = true; saveState(); updateProgress();
  }catch(e){ $("#calcResult").textContent=`Error: ${e.message}`; }
};

$("#checkSumCode").onclick = () => {
  const n=$("#sumNumCode").value.replace(/\s/g,"").toLowerCase();
  const d=$("#sumDenCode").value.replace(/\s/g,"").toLowerCase();
  const r=$("#sumReturnCode").value.replace(/\s/g,"").toLowerCase();
  const numOK = n.includes("numerador*otra.denominador") && n.includes("otra.numerador*denominador") && n.includes("+");
  const denOK = d === "denominador*otra.denominador" || d === "otra.denominador*denominador";
  const retOK = r.includes("newfraccion") && r.includes("nuevonumerador") && r.includes("nuevodenominador");
  const f=$("#sumCodeFeedback");
  if(numOK&&denOK&&retOK){
    f.textContent="Implementación correcta.";
    f.className="feedback good";
    state.sumComplete=true; saveState(); updateProgress();
  }else{
    f.textContent="Revisa productos cruzados, denominador común y creación de un objeto nuevo.";
    f.className="feedback bad";
  }
};

const tests = ["1/2 + 1/3 = 5/6","2/4 + 1/2 = 1","-1/3 + 1/3 = 0","3/5 + 0/1 = 3/5"];
$("#testCases").innerHTML = tests.map((x,i)=>`<div class="test-card"><strong>Caso ${i+1}</strong><p>${x}</p></div>`).join("");

const debugOptions = [
  ["Los atributos son públicos", true],
  ["El constructor permite denominador cero", true],
  ["No se simplifica ni normaliza", true],
  ["sumar usa una fórmula incorrecta", true],
  ["sumar modifica el objeto actual", true],
  ["convertirADouble usa división entera", true],
  ["esIgual compara referencias con ==", true],
  ["La clase utiliza demasiados getters", false],
  ["El constructor debería ser privado", false]
];
$("#debugOptions").innerHTML = debugOptions.map((x,i)=>`
<label class="check-option"><input type="checkbox" data-index="${i}"><span>${x[0]}</span></label>`).join("");
$("#gradeDebug").onclick=()=>{
  const selected=$$("#debugOptions input").map(x=>x.checked);
  const score=selected.filter((v,i)=>v===debugOptions[i][1]).length;
  const f=$("#debugResult");
  f.textContent=`${score}/${debugOptions.length} decisiones correctas.`;
  f.className=`feedback ${score===debugOptions.length?"good":"bad"}`;
  if(score===debugOptions.length){state.debugComplete=true;saveState();updateProgress();}
};
$("#saveDebugTest").onclick=()=>{
  state.debugTest=$("#debugTest").value.trim();saveState();toast("Prueba guardada");
};
$("#debugTest").value=state.debugTest||"";

["tdaValues","tdaOperations","tdaInvariants","tdaInterface","tdaRepresentation"].forEach(id=>{
  $("#"+id).value=state[id]||"";
});
$("#saveTransfer").onclick=()=>{
  const ids=["tdaValues","tdaOperations","tdaInvariants","tdaInterface","tdaRepresentation"];
  ids.forEach(id=>state[id]=$("#"+id).value.trim());
  state.tdaChoice=$("#tdaChoice").value;
  saveState();
  const completed=ids.every(id=>state[id].length>15);
  const f=$("#transferFeedback");
  f.textContent=completed?"Diseño guardado. Incluye todos los componentes del TDA.":"Completa cada apartado con mayor precisión.";
  f.className=`feedback ${completed?"good":"bad"}`;
  if(completed){state.transferComplete=true;saveState();updateProgress();}
};

const rubricItems=[
  "Identifico valores y operaciones del TDA",
  "Establezco invariantes verificables",
  "Aplico encapsulamiento",
  "Valido el estado del objeto",
  "Mantengo la inmutabilidad",
  "Simplifico correctamente",
  "Implemento las operaciones",
  "Pruebo casos normales y límite",
  "Explico decisiones de diseño",
  "Diferencio especificación e implementación"
];
$("#checklist").innerHTML=rubricItems.map((x,i)=>`
<div class="rubric-row">
  <strong>${x}</strong>
  ${["Logrado","Parcial","Requiere apoyo"].map(v=>`<label><input type="radio" name="r${i}" value="${v}"> ${v}</label>`).join("")}
</div>`).join("");
$$(".rubric input").forEach(r=>{
  if(state.rubric?.[r.name]===r.value) r.checked=true;
  r.onchange=()=>{
    state.rubric=state.rubric||{};state.rubric[r.name]=r.value;saveState();updateProgress();
  };
});

["exit1","exit2","exit3"].forEach(id=>$("#"+id).value=state[id]||"");
$("#submitExit").onclick=()=>{
  ["exit1","exit2","exit3"].forEach(id=>state[id]=$("#"+id).value.trim());
  const ok=state.exit1.length>25&&state.exit2.length>10&&state.exit3.length>10;
  const f=$("#exitFeedback");
  f.textContent=ok?"Ticket entregado.":"Completa las tres respuestas con argumentos suficientes.";
  f.className=`feedback ${ok?"good":"bad"}`;
  if(ok){state.exitComplete=true;saveState();updateProgress();}
};

$("#unlockTeacher").onclick=()=>{
  if($("#teacherCode").value==="TDA2026"){
    $("#teacherContent").classList.remove("hidden");
    toast("Guía docente desbloqueada");
  }else toast("Código incorrecto");
};

let seconds = state.timerSeconds ?? 7200;
let interval = null;
function renderTimer(){
  const m=Math.floor(seconds/60).toString().padStart(2,"0");
  const s=(seconds%60).toString().padStart(2,"0");
  $("#timer").textContent=`${m}:${s}`;
}
renderTimer();
$("#timerBtn").onclick=()=>{
  if(interval){
    clearInterval(interval); interval=null; $("#timerBtn").textContent="Continuar";
    return;
  }
  $("#timerBtn").textContent="Pausar";
  interval=setInterval(()=>{
    if(seconds>0){seconds--;state.timerSeconds=seconds;saveState();renderTimer();}
    else{clearInterval(interval);interval=null;toast("La sesión ha finalizado");}
  },1000);
};

function updateProgress(){
  const metrics=[
    (state.visited||[]).length>=6,
    Object.values(state.initial||{}).filter(Boolean).length>=5,
    !!state.feynmanComplete,
    !!state.classificationComplete,
    (state.stepsVisited||[]).length>=5,
    !!state.labUsed,
    !!state.sumComplete,
    !!state.debugComplete,
    !!state.transferComplete,
    Object.keys(state.rubric||{}).length>=8,
    !!state.exitComplete
  ];
  const p=Math.round(metrics.filter(Boolean).length/metrics.length*100);
  $("#progressBar").style.width=`${p}%`;
  $("#progressText").textContent=`${p}% completado`;
}
updateProgress();

$("#resetBtn").onclick=()=>{
  if(confirm("¿Deseas borrar todo el progreso guardado?")){
    localStorage.removeItem("tdaAppState");
    location.reload();
  }
};

showSection(state.currentSection || "inicio");
