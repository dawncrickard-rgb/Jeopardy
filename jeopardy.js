const API = "https://rithm-jeopardy.herokuapp.com/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES = 5;

let categories = [];

const questionBox = document.getElementById("question-box");
const answerBox = document.getElementById("answer-box");
const board = document.getElementById("jeopardy");
const restartBtn = document.getElementById("restart");
const music = document.getElementById("jeopardy-music");

function removeHTML(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
}

async function getCategoryIds() {
    const res = await axios.get(`${API}categories?count=100`);

    const validCategories = res.data.filter(cat => cat.clues_count >= NUM_CLUES);

    return _.sampleSize(validCategories, NUM_CATEGORIES).map(cat => cat.id);
}

async function getCategory(id) {
    const res = await axios.get(`${API}category?id=${id}`);

    const validClues = res.data.clues.filter(clue => clue.question && clue.answer);

    const clues = _.sampleSize(validClues, NUM_CLUES).map(clue => {
        return {
            question: removeHTML(clue.question),
            answer: removeHTML(clue.answer),
            showing: null
        };
    });

    return {
        title: removeHTML(res.data.title),
        clues: clues
    };
}

async function fillCategories() {
    const categoryIds = await getCategoryIds();

    categories = [];

    for (let id of categoryIds) {
        const category = await getCategory(id);
        categories.push(category);
    }
}

function fillTable() {
    board.innerHTML = "";

    const headerRow = document.createElement("tr");

    for (let category of categories) {
        const th = document.createElement("th");
        th.innerText = category.title;
        headerRow.appendChild(th);
    }

    board.appendChild(headerRow);

    for (let clueIndex = 0; clueIndex < NUM_CLUES; clueIndex++) {
        const row = document.createElement("tr");

        for (let categoryIndex = 0; categoryIndex < NUM_CATEGORIES; categoryIndex++) {
            const td = document.createElement("td");

            td.innerText = `$${(clueIndex + 1) * 200}`;
            td.dataset.category = categoryIndex;
            td.dataset.clue = clueIndex;

            td.addEventListener("click", handleClick);

            row.appendChild(td);
        }

        board.appendChild(row);
    }
}

function handleClick(event) {
    const cell = event.target;

    const categoryIndex = cell.dataset.category;
    const clueIndex = cell.dataset.clue;

    const clue = categories[categoryIndex].clues[clueIndex];

    if (clue.showing === null) {
        cell.innerText = "?";
        questionBox.innerText = clue.question;
        answerBox.innerText = "";
        clue.showing = "question";
    } else if (clue.showing === "question") {
        cell.innerText = "✓";
        answerBox.innerText = clue.answer;
        clue.showing = "answer";
    }
}

async function startGame() {
    questionBox.innerText = "Question will appear here";
    answerBox.innerText = "Answer will appear here";
    board.innerHTML = "Loading...";

    music.play().catch(() => {
        console.log("Music will start after user clicks the button.");
    });

    await fillCategories();
    fillTable();
}

restartBtn.addEventListener("click", startGame);

startGame();