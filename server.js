require("dotenv").config()
const express = require("express")
const cors = require("cors")
const axios = require('axios');
const lyricsFinder = require("lyrics-finder")
const SpotifyWebApi = require("spotify-web-api-node")

const app = express()
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken
  console.log(refreshToken)
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken,
  })

  spotifyApi
    .refreshAccessToken()
    .then(data => {
      res.json({
        accessToken: data.body.accessToken,
        expiresIn: data.body.expiresIn,
      })
    })
    .catch(err => {
      console.log(err)
      res.sendStatus(400)
    })
})


const GENIUS_API_BASE_URL = 'https://api.genius.com';
const accessToken = process.env.GENIUS_ACCESS_TOKEN;

app.get('/search-genius', async (req, res) => {
    try {
        const { data } = await axios.get(`${GENIUS_API_BASE_URL}/search`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: { q: req.query.q }
        });
        res.json(data.response.hits);
    } catch (error) {
        console.error("Error with Genius API:", error);
        res.status(500).send("Error fetching data from Genius");
    }
});

/////////////


app.post("/login", async (req, res) => {
  try {
    const code = req.body.code;
    const spotifyApi = new SpotifyWebApi({
      redirectUri: process.env.REDIRECT_URI,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    });

    const data = await spotifyApi.authorizationCodeGrant(code);
    res.json({
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      expiresIn: data.body.expires_in,
    });
  } catch (err) {
    console.error("Error in /login:", err);
    res.status(400).send("Error during authorization");
  }
});

app.get("/lyrics", async (req, res) => {
  const lyrics =
    (await lyricsFinder(req.query.artist, req.query.track)) || "No Lyrics Found"
  res.json({ lyrics })
  console.log(lyrics);
})


const PORT = 3001; 
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});