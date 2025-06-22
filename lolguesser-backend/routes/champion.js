const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

router.get('/daily', (req, res) => {
  const dataPath = path.join(__dirname, '..', 'champions.json');
  const champList = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const today = new Date().toISOString().split('T')[0]; 
  const seed = hashString(today);
  const index = seed % champList.length;

  const dailyChampion = champList[index];
  res.json(dailyChampion);
});

module.exports = router;