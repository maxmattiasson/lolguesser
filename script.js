
const confirmInput = document.getElementById('confirmInput');
const guessInput = document.getElementById('guessInput');
const guessContainer = document.getElementById('guessContainer');

let target;
let champList = [];
let alreadyGuessed = [];

async function getChampList(){
    const res = await fetch('champions.json');
    champList = await res.json();
}
getChampList();

window.addEventListener('DOMContentLoaded', async () => {
  await getChampList();
  await getDailyChampion();
});

async function getDailyChampion() {
  try {
    const res = await fetch('https://lolguesser-backend.onrender.com/api/champion/daily');
    target = await res.json();
    console.log('champion from backend:', target);
  } catch (err) {
    console.error('Error fetching daily champion:', err);
  }
}

/* OLD LOCAL SETTING TARGET REPLACED BY BACKEND 
window.addEventListener('DOMContentLoaded', async () => {
  await getChampList();
  target = setTarget();
  console.log(target.name);
});

function setTarget(){
    const targetNum = Math.floor(Math.random()*champList.length);
    return champList[targetNum];
}
*/
confirmInput.addEventListener('click', () => {
    const rawGuess = guessInput.value;
    const guess = cleanString(rawGuess);
    const champ = champList.find(c => cleanString(c.name) === guess);
    if (!champ) return;

    if (!alreadyGuessed.includes(champ)) {alreadyGuessed.push(champ)} else return;
      
    guessInput.value = '';

    if (champ.name === target.name) {
      winnerScreen();
    }

    const row = makeGuessRow(champ);
    compareGuess(champ, row);
  
})

function cleanString(str){
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function makeGuessRow(champ){

    const guessRow = document.createElement('div');
    guessRow.classList.add('guess-row');
    guessContainer.prepend(guessRow);

    const img = document.createElement('img');
    img.src = champ.icon;
    img.alt = champ.name; 
    img.classList.add('champ-icon');
    guessRow.appendChild(img);

    const skip = ['icon', 'name']
    for (const [key, value] of Object.entries(champ)) {
        if (skip.includes(key)) continue;

        const divInfo = document.createElement('div');
        divInfo.classList.add('info-cont');
        divInfo.dataset.type = key;
        guessRow.appendChild(divInfo);
            if (Array.isArray(value)) {
            divInfo.textContent = value.join(', ')
        } else {divInfo.textContent = value}
    }
    return guessRow;
}

function compareGuess(champ, row){

const keys = ['gender', 'position', 'species', 'resource', 'rangeType', 'region', 'releaseYear'];

for (let key of keys) {
  const div = row.querySelector(`[data-type="${key}"]`);
  if (!div) continue;

  const guessValue = champ[key];
  const targetValue = target[key];

const guessArr = Array.isArray(guessValue) ? [...guessValue].sort() : [guessValue];
const targetArr = Array.isArray(targetValue) ? [...targetValue].sort() : [targetValue];

const fullMatch = JSON.stringify(guessArr) === JSON.stringify(targetArr);
const partialMatch = guessArr.some(val => targetArr.includes(val));

  if (fullMatch) {
    div.style.backgroundColor = 'green';
  } else if (partialMatch) {
    div.style.backgroundColor = 'yellow';
  } else {
    div.style.backgroundColor = 'red';
  }
} 
}

function winnerScreen() {
  const jsConfetti = new JSConfetti();
  jsConfetti.addConfetti({
    emojis: ["👑", "💯", "💦", "😤"],
    emojiSize: 50,
    confettiNumber: 200,
    confettiColors: [
      "#ff0a54",
      "#ff477e",
      "#ff7096",
      "#ff85a1",
      "#fbb1bd",
      "#f9bec7",
    ],
  });
}
