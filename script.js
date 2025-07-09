
const confirmInput = document.getElementById('confirmInput');
const guessInput = document.getElementById('guessInput');
const guessContainer = document.getElementById('guessContainer');
const serverStatus = document.getElementById('server-status');
const loginPage = document.getElementById('login-wrapper');
const gamePage = document.getElementById('game-container');
const passwordField = document.getElementById('signup-password');
const passwordField2 = document.getElementById('signup-password2');
const loginPassword = document.getElementById('login-password')
const usernameField = document.getElementById('username-field');

let target;
let champList = [];
let alreadyGuessed = [];
let stopGame = false;
guessInput.disabled = true;

showGame();

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
    console.log('Got champion from backend:');
    checkServer();
  } catch (err) {
    console.error('Error fetching daily champion:', err);
  }
}

async function sendGuess(guessedChamp, row) {
  try {
    const res = await fetch('https://lolguesser-backend.onrender.com/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guessedChamp)
    });

    const data = await res.json();
  console.log("sendGuess called!");

    compareServerFeedback(data.feedback, row);

    if (data.result === 'correct') {
      setTimeout(() => {
        guessInput.disabled = true;
        winnerScreen();
      }, 3500);
    }

  } catch (err) {
    console.error('Guess failed:', err);
  }
}
confirmInput.addEventListener('click', () => {
    const rawGuess = guessInput.value;
    const guess = cleanString(rawGuess);
    const checkChamp = () => {
      // 1. Does it match nicknames or hardcoded str.length === 2
        for (const [key, value] of Object.entries(champMapper)) {
          if (guess === key) return champList.find(c => c.name === value);
        } 
      if (guess.length >= 3) {
        for (let c of champList) {
          let name = c.name;
          if (cleanString(name).startsWith(guess)){
          return c;
         }
       }
      }
    }
    const champ = checkChamp();

    if (!champ) return;
    if (!alreadyGuessed.includes(champ)) {alreadyGuessed.push(champ)} else return;
    guessInput.value = '';

    const row = makeGuessRow(champ);
    console.log("Using backend comparison!");
    sendGuess(champ, row);
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
    guessContainer.scrollTop = 0;

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
    addAnimation();
    return guessRow;
}

function compareServerFeedback(feedback, row) {
  const keys = Object.keys(feedback);

  for (let key of keys) {
    const div = row.querySelector(`[data-type="${key}"]`);
    if (!div) continue;

    const style = feedback[key];

    if (style === 'green') {
      div.style.backgroundColor = 'green';
    } else if (style === 'yellow') {
      div.style.backgroundColor = 'yellow';
    } else if (style === 'red') {
      div.style.backgroundColor = 'red';
    } else if (style === 'arrowUp') {
      const arrow = document.createElement('div');
      arrow.classList.add('arrowup');
      arrow.style.transform = 'rotate(180deg)';
      div.appendChild(arrow);
    } else if (style === 'arrowDown') {
      const arrow = document.createElement('div');
      arrow.classList.add('arrowup');
      div.prepend(arrow);
    }
  }
  console.log('Styling', key, feedback[key]);
console.log('Div:', div);
}
/*
function compareGuess(champ, row){

const keys = ['gender', 'position', 'species', 'resource', 'rangeType', 'region', 'releaseYear'];

for (let key of keys) {
  const div = row.querySelector(`[data-type="${key}"]`);
  if (!div) continue;

  const guessValue = champ[key];
  const targetValue = target[key];

const guessArr = Array.isArray(guessValue) ? [...guessValue].sort() : [guessValue];
const targetArr = Array.isArray(targetValue) ? [...targetValue].sort() : [targetValue];

  if (key === 'releaseYear') {
    if (guessValue > targetValue) {
    const test = document.createElement('div');
    test.classList.add('arrowup');
    test.style.transform = "rotate(180deg)";
    div.appendChild(test);
  } else if (guessValue < targetValue) {
    const test = document.createElement('div');
    test.classList.add('arrowup');
    div.prepend(test);
  } else {div.style.backgroundColor = 'green'}
}

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
*/
const champMapper = {
  mf: "Miss Fortune",
  gp: "Gangplank",
  ez: "Ezreal",
  vi: "Vi",
  mumu: "Amumu",
  asol : "Aurelion Sol",
  bv: "Bel'Veth",
  mundo: "Dr. Mundo",
  j4: "Jarvan IV",
  k6: "Kha'Zix",
  lb: "LeBlanc",
  yi: "Master Yi",
  ok: "Rammus",
  glasc: "Renata Glasc",
  rg: "Renata Glasc",
  tk: "Tahm Kench",
  tf: "Twisted Fate",
  vk: "Vel'Koz",
  ww: "Warwick",
  wu: "Wukong",
};

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

document.addEventListener("keydown", (e) => {
  if (
    (e.key === "Enter" && location.search === "?screen=game")
  ) {
    confirmInput.click();
  }
});


function addAnimation(){
  const timeAnimation = document.querySelectorAll('.info-cont');
  timeAnimation.forEach((cont, i) => {
  setTimeout(() => {
    cont.classList.add('animate-in');
  }, i * 500);
});
}

function checkServer(){
  if (!target || typeof target !== "object" || !target.name) {
    serverStatus.textContent = "Servern håller på att vakna, redo om några sekunder ...";
    serverStatus.style.color = 'Yellow';
    guessInput.disabled = true;
  } else {
    serverStatus.textContent = "Redo!";
    serverStatus.style.color = "lightgreen";
    guessInput.disabled = false;
  }
}

login.addEventListener('click', showLogin);

document.getElementById('return-game').addEventListener('click', showGame);

document.getElementById('sign-log').addEventListener('click', () => {
  if (loadLogin) {
    showLogin();
  } else {
    showSignup();
  }
})

let loadLogin = true;

document.getElementById('eye').addEventListener('click', () => {
  if (passwordField.type === 'password' && loadLogin === true) {
    passwordField.type = 'text';
    passwordField2.type = 'text';
  } else if (passwordField.type === 'text' && loadLogin === true){
    passwordField.type = 'password';
    passwordField2.type = 'password';
  }
})
document.getElementById('login-eye').addEventListener('click', () => {
  if (loginPassword.type === 'password' && loadLogin === false){
    loginPassword.type = 'text';
  } else if(loginPassword.type === 'text' && loadLogin === false){
    loginPassword.type = 'password';
  }
})


function showLogin(){
  loginPassword.value = '';
  history.pushState({ screen: 'login' }, '', '?screen=login');
  gamePage.style.display = 'none';
  loginPage.style.display = 'flex';
  loginPassword.style.display = 'flex';
  passwordField.style.display = 'none';
  passwordField2.style.display = 'none';
  document.getElementById('eye').style.display = 'none';
  document.getElementById('login-eye').style.display = 'flex'
  document.getElementById('login-head').textContent = 'Log in';
  document.getElementById('sign-log').textContent = `Don't have an account? Sign up by clicking here`;
  loadLogin = false;
}

function showSignup(){
  passwordField.value = '';
  passwordField2.value = '';
  passwordField.style.display = 'flex';
  passwordField2.style.display = 'flex';
  loginPassword.style.display = 'none';
  document.getElementById('login-eye').style.display = 'none';
  document.getElementById('eye').style.display = 'flex';
  document.getElementById('login-head').textContent = 'Create account';
  document.getElementById('sign-log').textContent = `Already have an account? Log in by clicking here`;
  loadLogin = true;
}

function showGame(){
  history.pushState({ screen: 'game' }, '', '?screen=game');
  loginPage.style.display = 'none';
  gamePage.style.display = 'block';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && gamePage.style.display === 'none') {
    showGame();
  }
});

document.getElementById('login-btn').addEventListener('click', (e) => {
  e.preventDefault();

  if (loadLogin) {
    signUp();
  } else logIn();
  }
)


function signUp(){
let username = usernameField.value.trim();
const password1 = passwordField.value;
const password2 = passwordField2.value;

if (password1 === password2 && password1.length > 5) {
  console.log("Password approved!");
} else {
  showError("Passwords must match and be at least 6 characters.");
}

const usernameRegex = /^[a-zA-Z0-9]{3,15}$/;
if (!usernameRegex.test(username)) {
  showError("Username must be 3-15 letters or numbers, no symbols or spaces.");
  }
}

function logIn(){

}

function showError(message){
  let errMessage = document.querySelector('.error-message');
  errMessage.textContent = message;
  errMessage.style.display = 'block';

[usernameField, passwordField, passwordField2].forEach(field => {
  field.addEventListener('input', () => {
    errMessage.style.display = 'none';
  });
});
};

window.addEventListener("popstate", () => {
  if (location.search === "?screen=login") {
    loginPage.style.display = "flex";
    gamePage.style.display = "none";
  } else {
    gamePage.style.display = "block";
    loginPage.style.display = "none";
  }
});