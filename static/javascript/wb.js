// Declaration
let data = [];
let dataOfCurrentDay = [];

// Data Handling
async function fetch_data(){
    const res = await fetch("../static/data/words.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw_data = await res.json();
    data = raw_data;

    return;
}

function getDayData(day) { // 특정 DAY의 단어들을 가져옴
    dataOfCurrentDay = data.filter(x => x.day === day);
}

// Constants
const wordblock_tpl = document.getElementById("wordblock");
const exampleblock_tpl = document.getElementById("exampleblock");
const unselected_tpl = document.getElementById("unselected");

// Use HTML Template
function giveExampleHTML(d) { // Example 안에 있는 걸 넣어
    const node = exampleblock_tpl.content.cloneNode(true);
    const meaning_el = node.querySelector(".meaning");
    const esentence_el = node.querySelector(".esentence");
    const ksentence_el = node.querySelector(".ksentence");

    let esentence_text = d.e_sentence;
    for (let i=1; i<=d.blank_count; i++) {
        esentence_text = esentence_text.replace(`_${i}_`, "<span>"+d.blanks[i-1]+"</span>");
    }

    meaning_el.textContent = d.meaning;
    esentence_el.innerHTML = esentence_text;
    ksentence_el.textContent = d.k_sentence;

    const frag = document.createDocumentFragment();
    frag.appendChild(node);

    return frag;
}

function createWordBlock() {
    const largeFrag = document.createDocumentFragment();

    for (const d of dataOfCurrentDay) {
        const node = wordblock_tpl.content.cloneNode(true);
        const cont = node.querySelector(".wordcontainer");
        const word_el = cont.querySelector(".word");
        const num_el = cont.querySelector(".wordnum");
        const examplecontainer = cont.querySelector(".examplecontainer");
        const frag = document.createDocumentFragment();

        word_el.textContent = d.word;
        num_el.textContent = d.wordnum;

        for (const exs of d.examples) {
            const exfrag = giveExampleHTML(exs);
            frag.appendChild(exfrag);
        }
        examplecontainer.appendChild(frag);

        largeFrag.appendChild(node);
    }

    document.querySelector(".mainstream").appendChild(largeFrag);
}