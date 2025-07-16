
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
const loginContent = document.getElementById('loggedin-block');
const loginBtn = document.getElementById('login');
const rememberMeField = document.getElementById('remember-me');
const logoutBtn = document.getElementById('logout');
const statsBtn = document.getElementById('stats');
const statsPage = document.getElementById('stats-page');

let champList = [];
let alreadyGuessed = [];
let currentUser = null;
let stopGame = false;
let combinedStats = null;
let isLoggedIn = false;
guessInput.disabled = false;


window.addEventListener('DOMContentLoaded', async () => {
  showOnly(); 

  const urlParams = new URLSearchParams(window.location.search);
  const screen = urlParams.get('screen');

  await getChampList();

  let loggedIn = false;
  try {
    const profileRes = await fetch('https://api.lolgiss.com/api/profile', { credentials: 'include' });
    if (!profileRes.ok) throw new Error();

    const profile = await profileRes.json();
    currentUser = profile.user.username;
    isLoggedIn = loggedIn = true;

    await loadPreviousGuesses();
    await combineStatsRanks();
    await getYesterdayChamp();

  } catch (err) {
    isLoggedIn = loggedIn = false;
    currentUser = null;
  }

  if (screen === 'stats' && loggedIn) {
    showStats(combinedStats);
  } else if (screen === 'stats' && !loggedIn) {
    showOnly('game-container');
    history.replaceState({ screen: 'game' }, '', '?screen=game');
  } else if (screen === 'game') {
    showOnly('game-container', loggedIn ? 'loggedin-block' : null);
  } else if (!screen && loggedIn) {
    showOnly('game-container', 'loggedin-block');
    history.replaceState({ screen: 'game' }, '', '?screen=game');
  } else {
    showOnly('game-container', 'server-status');
    serverStatus.textContent = 'Please log in for the ultimate experice';
    serverStatus.style.color = 'lightgreen';
  }
  if (isLoggedIn) {
  welcomeUser();
  loginBtn.style.display = 'none';
} 
});

function showOnly(...idsToShow) {
  const all = ['login-wrapper', 'game-container', 'loggedin-block', 'stats-page', 'server-status'];

  all.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (idsToShow.includes(id)) {
      el.style.display = (id === 'login-wrapper') ? 'flex' : 'block';
      el.style.display = (id === 'loggedin-block') ? 'flex' : 'block';
    } else {
      el.style.display = 'none';
    }
  });
}

async function getChampList(){
    const res = await fetch('champions.json');
    champList = await res.json();
}

async function getYesterdayChamp(){
   try { const res = await fetch('https://api.lolgiss.com/api/yesterday');
    if (!res.ok) return;
    const data = await res.json();

    const yesterdayImg = document.createElement('img');
    yesterdayImg.src = data.icon;
    yesterdayImg.alt = data.name;
    yesterdayImg.title = data.name;
    yesterdayImg.classList.add('yesterday-img');
    const yesterdayDiv = document.getElementById('yesterday-champ');
    yesterdayDiv.textContent = `Yesterdays champion: `;
    yesterdayDiv.appendChild(yesterdayImg);
    console.log(data);
  } catch (err) {
    document.getElementById('yesterday-champ').textContent = 'You didnt guess yesterday so you dont get to know'
  }
}

async function sendGuess(guessedChamp, row) {
  try {
    const res = await fetch('https://api.lolgiss.com/api/guess', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guessedChamp)
    });

    const data = await res.json();

    compareServerFeedback(data.feedback, row);

    if (data.result === 'correct') {
      setTimeout(() => {
        guessInput.disabled = true;
        stopGame = true;
        winnerScreen();
        lockGameUI();
      }, 3500);
    }

  } catch (err) {
      console.error('❌ sendGuess failed:', err);
  }
}
confirmInput.addEventListener('click', () => {
    if (stopGame) return; 

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
    sendGuess(champ, row);
})

function cleanString(str){
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function makeGuessRow(champ, { animate = true } = {}) {

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
        if (animate) {addAnimation()} else {instantAnimation()} 
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
      div.style.backgroundColor = 'red';
    } else if (style === 'arrowDown') {
      const arrow = document.createElement('div');
      arrow.classList.add('arrowup');
      div.prepend(arrow);
      div.style.backgroundColor = 'red';      
    }
  }
}

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
    confettiNumber: 100,
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
    if (stopGame) return; 
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
function instantAnimation(){
  const timeAnimation = document.querySelectorAll('.info-cont');
  timeAnimation.forEach(cont => cont.classList.add('animate-in'));
}

loginBtn.addEventListener('click', showLogin);

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
  rememberMeField.style.display = 'inline-block';
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
  rememberMeField.style.display = 'none';
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
  statsPage.style.display = 'none';
}

function showStats(combinedStats){
  loginPage.style.display = 'none';
  gamePage.style.display = 'none';
  statsPage.style.display = 'block';
  history.pushState({ screen: 'stats' }, '', '?screen=stats');
  document.getElementById('stats-username').textContent = `📊 ${currentUser.charAt(0).toUpperCase()}${currentUser.slice(1)}`;

  displayStats(combinedStats);
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
let username = usernameField.value.trim().toLowerCase();
const password1 = passwordField.value;
const password2 = passwordField2.value;
const usernameRegex = /^[a-zA-Z0-9]{3,15}$/;

if (!usernameRegex.test(username)) {
  showError("Username must be 3-15 letters or numbers, no symbols or spaces.");
} else if (password1 !== password2 || password1.length <= 5) {
  showError("Passwords must match and be at least 6 characters.");
} else {

  fetch('https://api.lolgiss.com/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username,
      password: password1
    })
  })
 .then(async res => {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Signup failed.');
  }
      usernameField.value = '';
      passwordField.value = '';
      passwordField2.value = '';
      showError('Sign up successful!');
    })
    .catch(err => {
      console.error('❌ Signup failed:', err);
      showError(err.message);
    });

  }
}

function logIn(){
  const username = usernameField.value.trim().toLowerCase();
  const password = loginPassword.value; 
  const rememberMe = document.getElementById('rememberMe');
  const remember = rememberMe.checked;

 fetch('https://api.lolgiss.com/api/login', {
  method: 'POST',
  credentials: 'include',  
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ username, password, remember })
})
  .then(async res => {
    const data = await res.json();
    
    if (!res.ok) {
      showError(data.error || 'Login failed.');
      return;
    }
    checkLoginStatus();
    showGame();
    alreadyGuessed = [];
    guessContainer.innerHTML = '';
    welcomeUser();
  })
  .catch(err => {
    showError('Something went wrong. Try again later.');
  });
}

function showError(message){
  let errMessage = document.querySelector('.error-message');
  errMessage.textContent = message;
  errMessage.style.visibility = 'visible';
  
  if (message === 'Sign up successful!') {
     errMessage.style.color = 'green';
  } else {errMessage.style.color = 'red';}

[usernameField, passwordField, passwordField2, loginPassword].forEach(field => {
  field.addEventListener('input', () => {
    errMessage.style.visibility = 'hidden';
  });
});
};

window.addEventListener("popstate", () => {
  if (location.search === "?screen=login") {
    loginPage.style.display = "flex";
    gamePage.style.display = "none";
    statsPage.style.display = "none";
  } else if (location.search === "?screen=game") {
    gamePage.style.display = "block";
    loginPage.style.display = "none";
    statsPage.style.display = "none";
  } else if (location.search === "?screen=stats"){
    gamePage.style.display = "none";
    loginPage.style.display = "none";
    statsPage.style.display = "block";
  }
});

async function checkLoginStatus() {
  try {
    const res = await fetch('https://api.lolgiss.com/api/profile', {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) throw new Error();

    const data = await res.json();
    isLoggedIn = true;

    currentUser = data.user.username;
    serverStatus.textContent = `Welcome, ${currentUser}!`;
    serverStatus.style.color = 'white';
    loginContent.style.display = 'flex';
    loginBtn.style.display = 'none';

    await loadPreviousGuesses();
  } catch {
    isLoggedIn = false;

    loginContent.style.display = 'none';
    loginBtn.style.display = 'block';
  }
}

logoutBtn.addEventListener('click', () => {
  fetch('https://api.lolgiss.com/api/logout', {
  method: 'POST',
  credentials: 'include',  
  }) .then(res => res.json())
     .then(data =>{
      isLoggedIn = false;
      checkLoginStatus();
      alreadyGuessed = [];
      guessContainer.innerHTML = '';
      stopGame = false;
      unlockGameUI();
      sessionStorage.removeItem('combinedStats');
      showGame();
      loginBtn.style.display = 'block';
      serverStatus.style.display = 'none'
     })
    .catch(err => {
    console.error('❌ Logout failed:', err);
})
})
async function loadPreviousGuesses() {
  try {
    const res = await fetch('https://api.lolgiss.com/api/guess/today', {
      method: 'GET',
      credentials: 'include'
    });

    const data = await res.json();
    alreadyGuessed = []; 
    guessContainer.innerHTML = '';

  for (const g of data.guesses) {
    const champ = g.guessedChamp;
    const feedback = g.feedback;

    if (alreadyGuessed.some(c => c.name === champ.name)) continue;
    alreadyGuessed.push(champ);

    const row = makeGuessRow(champ, {animate:false});
    compareServerFeedback(feedback, row);

  if (g.result === 'correct') {
        stopGame = true;
        lockGameUI();
    }
  }
  } catch (err) {
    console.error('❌ Failed to load previous guesses:', err);
  }
}

function lockGameUI() {
  guessInput.disabled = true;
  confirmInput.disabled = true;
  guessInput.placeholder = "🎉 You won!";
}
function unlockGameUI() {
  guessInput.disabled = false;
  confirmInput.disabled = false;
  guessInput.placeholder = "Skriv din gissning ...";
}

function welcomeUser(){
  serverStatus.style.display = 'block'
  serverStatus.textContent = `Welcome, ${currentUser}!`;
  serverStatus.style.color = 'white';
}

// STATS PAGE SETTINGS BELOW

document.getElementById('show-game').addEventListener('click', showGame);

statsBtn.addEventListener('click', async () => {

  const savedStats = sessionStorage.getItem('combinedStats');

  if (savedStats) {
    combinedStats = JSON.parse(savedStats);
    showStats(combinedStats);
    return;
  }

  try {
    await combineStatsRanks();
    if (combinedStats) {
      sessionStorage.setItem('combinedStats', JSON.stringify(combinedStats));
      showStats(combinedStats);
    } else {
      throw new Error();
    }
  } catch {
    alert('Could not load stats. Please refresh the page');
  }
});

async function fetchStats(){ 
  try {
    const res = await fetch('https://api.lolgiss.com/api/stats', {
      credentials: 'include'
    });
  return res.json();
  } catch (err) {
    console.error('Failed to import stats:', err);
  }
}

async function fetchLeaderboard(){
    const res = await fetch('https://api.lolgiss.com/api/leaderboard');
    return res.json();
}

async function combineStatsRanks(){
  try {
      const [stats, leaderboard] = await Promise.all([
        fetchStats(),
        fetchLeaderboard()
      ]);
  
    const user = leaderboard.find(p => p.username === stats.username);

    combinedStats = {
      stats,
      leaderboard,
      avgGuessRank: user?.avgGuessRank ?? 'N/A',
      oneshotRank: user?.oneshotRank ?? 'N/A',
      oneshotGames: user?.oneshotGames ?? 'N/A'
    }
    sessionStorage.setItem('combinedStats', JSON.stringify(combinedStats));
    displayStats(combinedStats);

  } catch (err) {
    console.error('Stats error:', err);
  }
}

function displayStats(combinedStats){

  const userStats = combinedStats.stats;
  const leaderboard = combinedStats.leaderboard;

  // General stats
    document.getElementById('total-guesses').textContent = `Total Guesses: ${userStats.totalGuesses}`;
    document.getElementById('games-played').textContent = `Games Played: ${userStats.gamesPlayed}`;
    document.getElementById('average-guesses').textContent = `Average Guesses: ${userStats.avgGuesses} - Global ranking #${combinedStats.avgGuessRank}`;
    document.getElementById('oneshots').textContent = `Oneshots: ${userStats.oneshots} - Global ranking #${combinedStats.oneshotRank}`;
    document.getElementById('streak').textContent = `🔥 Current streak: ${userStats.streak} 🔥`;
  // Leaderboard stats
    const topAvgGuess = leaderboard.slice().sort((a, b) => a.avgGuesses - b.avgGuesses).slice(0, 3);
    const topOneshots = leaderboard.slice().sort((a, b) => b.oneshotGames - a.oneshotGames).slice(0, 3);
    const topTotalGames = leaderboard.slice().sort((a, b) => b.totalGames - a.totalGames).slice(0, 3);

    topAvgGuess.forEach((player, i) => {
    const item = document.querySelector(`#top-avg li[data-rank="${i + 1}"]`);
    item.querySelector('.top-username').textContent = player.username;
    item.querySelector('.top-value').textContent = ` -  ${player.avgGuesses}`;
  });
    topOneshots.forEach((player, i) => {
    const item = document.querySelector(`#top-oneshot li[data-rank="${i + 1}"]`);
    item.querySelector('.top-username').textContent = player.username;
    // FIX THIS
    item.querySelector('.top-value').textContent = ` -  ${player.oneshots}`;
  });
    topTotalGames.forEach((player, i) => {
    const item = document.querySelector(`#top-gamer li[data-rank="${i + 1}"]`);
    item.querySelector('.top-username').textContent = player.username;
    item.querySelector('.top-value').textContent = ` -  ${player.totalGames}`;
  });
    // Last 7 games
 const colors = (n) => {
  if (n <= 4) return 'green';
  if (n <= 7) return 'orange';
  return 'red';
};

const container = document.getElementById('last-7-games');
container.innerHTML = '';

userStats.lastGames.forEach(game => {
  const span = document.createElement('span');
  span.classList.add('guess-box', colors(game.guessCount));
  span.textContent = game.guessCount;
  container.appendChild(span);
});

  // Accuracy stats
  document.getElementById('accuracy-release').textContent = `Average year difference per guess +- ${userStats.avgYearDiff} years`;
  document.getElementById('accuracy-gender').textContent = `Gender: ${userStats.accuracy.gender}% - Global average ${userStats.globalAccuracy.gender}%`;
  // Region is broken, FIX THIS
  document.getElementById('accuracy-region').textContent = `Region: ${userStats.accuracy.region}% - Global average ${userStats.globalAccuracy.region}%`;
  document.getElementById('accuracy-position').textContent = `Position: ${userStats.accuracy.position}% - Global average ${userStats.globalAccuracy.position}%`;
  document.getElementById('accuracy-species').textContent = `Species: ${userStats.accuracy.species}% - Global average ${userStats.globalAccuracy.species}%`;

}
