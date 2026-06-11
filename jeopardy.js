console.log("Jeopardy script loaded");

const API = "https://rithm-jeopardy.herokuapp.com/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES = 5;

let categories = [];

/* =========================
   GET CATEGORY IDS
========================= */
async function getCategoryIds() {
    try {
        const res = await axios.get(`${API}categories?count=100`);

        const valid = res.data.filter(
            c => c.clues_count && c.clues_count >= NUM_CLUES
        );

        return _.sampleSize(valid, NUM_CATEGORIES).map(c => c.id);

    } catch (err) {
        console.error("Error fetching category IDs:", err);
        return [];
    }
}

/* =========================
   GET ONE CATEGORY
========================= */
async function getCategory(id) {
    try {
        const res = await axios.get(`${API}category?id=${id}`);

        const validClues = res.data.clues.filter(
            c => c.question && c.answer
        );

        // SAFE FIX: avoid lodash randomness breaking layout
        const clues = validClues.slice(0, NUM_CLUES);

        return {
            id,
            title: res.data.title,
            clues: clues.map((c, i) => ({
                question: c.question,
                answer: c.answer,
                value: (i + 1) * 200,
                state: "hidden"
            }))
        };

    } catch (err) {
        console.error("Error fetching category:", id, err);

        return {
            id,
            title: "Error",
            clues: Array(NUM_CLUES).fill({
                question: "Error",
                answer: "Error",
                value: 0,
                state: "hidden"
            })
        };
    }
}

/* =========================
   BUILD BOARD
========================= */
function buildBoard() {
    $("#jeopardy thead").empty();
    $("#jeopardy tbody").empty();

    const header = $("<tr>");

    categories.forEach(cat => {
        header.append(`<th>${cat.title}</th>`);
    });

    $("#jeopardy thead").append(header);

    for (let y = 0; y < NUM_CLUES; y++) {
        const row = $("<tr>");

        for (let x = 0; x < NUM_CATEGORIES; x++) {
            const clue = categories[x]?.clues?.[y];

            const td = $("<td>");

            if (!clue) {
                td.text("");
                row.append(td);
                continue;
            }

            const cell = $("<div>")
                .text(`$${clue.value}`)
                .attr("data-question", clue.question)
                .attr("data-answer", clue.answer)
                .attr("data-state", "hidden");

            td.append(cell);
            row.append(td);
        }

        $("#jeopardy tbody").append(row);
    }
}

/* =========================
   CLICK HANDLER
========================= */
$("#jeopardy").on("click", "div", function () {
    const el = $(this);
    const state = el.attr("data-state");

    if (state === "hidden") {
        el.text(el.attr("data-question"));
        el.attr("data-state", "question");
    }

    else if (state === "question") {
        el.text(el.attr("data-answer"));
        el.attr("data-state", "answer");
        el.addClass("viewed");
    }
});

/* =========================
   START GAME
========================= */
async function startGame() {
    categories = [];

    $("#jeopardy thead").empty();
    $("#jeopardy tbody").empty();

    $("#jeopardy tbody").html(
        "<tr><td colspan='6'>Loading...</td></tr>"
    );

    const ids = await getCategoryIds();

    for (let id of ids) {
        categories.push(await getCategory(id));
    }

    buildBoard();
}

/* =========================
   INIT
========================= */
$(document).ready(function () {
    $("#restart").on("click", startGame);
});