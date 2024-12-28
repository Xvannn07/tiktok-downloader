const express = require('express');
const path = require('path');
const CryptoJS = require('crypto-js');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const secretKey = 'xvannn07-secret';

// Middleware
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json());

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-apikey'];
  const currentMinute = new Date().getUTCMinutes();

  // Generate API key untuk menit sekarang dan sebelumnya
  const validKeys = [
    CryptoJS.HmacSHA256(currentMinute.toString(), secretKey).toString(CryptoJS.enc.Hex),
    CryptoJS.HmacSHA256((currentMinute - 1).toString(), secretKey).toString(CryptoJS.enc.Hex)
  ];

  if (apiKey && validKeys.includes(apiKey)) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }
};


// Fungsi untuk mendekripsi URL
function decryptURL(encryptedURL) {
    // Decode terlebih dahulu
    const decoded = decodeURIComponent(encryptedURL);
    // Dekripsi URL
    const bytes = CryptoJS.AES.decrypt(decoded, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}


app.post('/api/uplink', apiKeyMiddleware, async (req, res) => {
    const { url, hash } = req.body;
    if (!hash) {
        return res.status(400).json({ msg: 'No text provided' });
    }

    // decrypt text
    try {
        const date_minute = new Date().getMinutes();
        const decryptedText = decryptURL(hash);
        console.log('Decrypted text:', decryptedText);

        // if decrypted text is not the same as the URL
        if(decryptedText !== `${url}-abc:${date_minute}`) {
            return res.status(400).json({ msg: 'Invalid hash!!' });
        }
        const response = await axios({
            url: `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
            method: 'GET',
            responseType: 'json'
        });
        res.json(response.data);
    } catch (error) {
        console.error('Failed to decrypt or fetch data:', error);
        res.status(500).json({ msg: 'Failed to decrypt or fetch video data' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
