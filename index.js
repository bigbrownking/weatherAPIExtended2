const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const mapboxgl = require('mapbox-gl');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const path = require('path');
const session = require('express-session');
const weatherApiKey = "ded43f556692a549ddcaeb57f76e48c9";
const newsApiKey = '7361d494737b4842af46de48d7f18efe';
const exchangeRateApiKey = '47c235dc2ff646eb84df0027158a209c';
const uri = "mongodb+srv://myAtlasDBUser:111@myatlasclusteredu.z25a02h.mongodb.net/?retryWrites=true&w=majority";
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({   
    secret: 'my-secret-key', 
    resave: false,
    saveUninitialized: true,
}));

let client;

async function run() {
    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

run().catch(console.dir);

app.use('/public/style.css', (req, res, next) => {
    res.type('text/css');
    next(); 
});

const authenticateUser = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    } 
    res.redirect('/login');
};

app.get("/front.js", function (req, res) {
    res.sendFile(__dirname + '/public/front.js', { headers: { 'Content-Type': 'application/javascript' } });
});

app.get('/', authenticateUser, (req, res) => {
    res.render('index');
});

app.get('/history', authenticateUser, async (req, res) => {
    try {
        const userId = req.session.userId; 
        const user = await client.db("users").collection("users").findOne({ _id: new ObjectId(userId) });

        let history = {};

        if (user.admin_status === 'admin') {
            const allWeatherHistory = await client.db("users").collection("weather").find({}).toArray();
            const allNewsHistory = await client.db("users").collection("news").find({}).toArray();
            const allCurrencyHistory = await client.db("users").collection("currency").find({}).toArray();

            history = {
                weather: allWeatherHistory,
                news: allNewsHistory,
                currency: allCurrencyHistory
            };
        } else {
            const weatherHistory = await client.db("users").collection("weather").find({ userId: userId }).toArray();
            const newsHistory = await client.db("users").collection("news").find({ userId: userId }).toArray();
            const currencyHistory = await client.db("users").collection("currency").find({ userId: userId }).toArray();

            history = {
                weather: weatherHistory,
                news: newsHistory,
                currency: currencyHistory
            };
        }
        
        res.render('history', { history: history });
    } catch (error) {
        console.error('Error retrieving history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/profile", authenticateUser, async (req, res) => {
    try {
        const user = await client.db("users").collection("users").findOne({ _id: new ObjectId(req.session.userId) });
        
        if (user.username === "alisher" && user.admin_status === "admin") {
            const users = await client.db("users").collection("users").find({}).toArray();
            res.render('admin-profile', { user: user, users: users, isAdmin: true });
        } else {
            res.render('user-profile', { user: user, isAdmin: false });
        }
    } catch (error) {
        console.error('Error fetching user profile data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/profile/edit', authenticateUser, async (req, res) => {
    try {
        const loggedInUserId = req.session.userId;
        const { userId, newUsername, newPassword } = req.body;
        const currentDate = new Date();

        const loggedInUser = await client.db("users").collection("users").findOne({ _id: new ObjectId(loggedInUserId) });

        if (loggedInUser && loggedInUser.admin_status === 'admin') {
            await client.db("users").collection("users").updateOne(
                { _id: new ObjectId(userId) },
                { $set: { username: newUsername, password: newPassword, update_date: currentDate } }
            );
        } else {
            await client.db("users").collection("users").updateOne(
                { _id: new ObjectId(loggedInUserId) },
                { $set: { username: newUsername, password: newPassword, update_date: currentDate } }
            );
        }

        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/profile/delete', authenticateUser, async (req, res) => {
    try {
        const loggedInUserId = req.session.userId;
        const userIdToDelete = req.body.userId; 
        const loggedInUser = await client.db("users").collection("users").findOne({ _id: new ObjectId(loggedInUserId) });

        if (loggedInUser.admin_status === 'admin') {
            await client.db("users").collection("users").deleteOne({ _id: new ObjectId(userIdToDelete) });
            res.redirect('/profile'); 
        } else {
            await client.db("users").collection("users").deleteOne({ _id: new ObjectId(loggedInUserId) });
            req.session.destroy(); 
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error deleting user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/login", (req, res) => {
    res.render('login', { error: null }); 
});

app.get("/signup", (req, res) => {
    res.render('signup', { error: null }); 
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    const user = await client.db("users").collection("users").findOne({ username: username });
  
    if (user && user.password === password) {
      req.session.userId = user._id;
      res.redirect('/'); 
    } else {
      res.render('login', { error: 'Invalid username or password' });
    }
});

app.post('/signup', async (req, res) => {
    const { newUsername, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.render('signup', { signupError: 'Passwords do not match' });
    }
    const existingUser = await client.db("users").collection("users").findOne({ username: newUsername });
    if (existingUser) {
        return res.render('signup', { signupError: 'Username already exists' });
    }

    try {
        const currentDate = new Date(); 

        const newUser = await client.db("users").collection("users").insertOne({
            username: newUsername,
            password: newPassword,
            creation_date: currentDate,
            update_date: currentDate,
            admin_status: 'regular' 
        });

        req.session.userId = newUser.insertedId;
        console.log('User successfully signed up. Redirecting...');
        res.redirect('/');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.redirect('/login');
        }
    });
});
app.get("/news", authenticateUser,(req, res) => {
    res.render('empty-news');
});

app.post("/news", authenticateUser, async (req, res) => {
    try {
        const city = req.body.city;
        const userAgent = req.get('user-agent');
        const newsUrl = `https://newsapi.org/v2/everything?q=${city}&apiKey=${newsApiKey}`;

        const options = {
            headers: {
                'User-Agent': userAgent
            }
        };

        https.get(newsUrl, options, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', async () => {
                const newsData = JSON.parse(data);
                try {
                    const user = await client.db("users").collection("users").findOne({ _id: new ObjectId(req.session.userId) });
                    await client.db("users").collection("news").insertOne({
                        userId: req.session.userId,
                        username: user.username, 
                        news: newsData,
                        city:city,
                        timestamp: new Date()
                    });
                }catch (error) {
                    console.error('Error inserting news data into MongoDB:', error);
                }
                res.render('news', { newsData });
            });
        }).on('error', (error) => {
            console.error('Error fetching news data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
    } catch (error) {
        console.error('Error fetching news data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/weather", authenticateUser, (req, res) =>{
    res.render("empty-weather");
});

app.post("/weather", authenticateUser, async (req, res) =>{
    try {
        const city = req.body.city;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;

        const weatherData = await fetchData(weatherUrl);
        if (weatherData.cod === 200) {
            console.log(weatherData);
            res.render('weather', {weather: weatherData });
        }   
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get("/currency",authenticateUser, async (req, res) => {
    try {
        const exchangeRateUrl = `https://open.er-api.com/v6/latest/KZT?apikey=${exchangeRateApiKey}`;
        const exchangeRateData = await fetchData(exchangeRateUrl);
        
        if (exchangeRateData && exchangeRateData.rates) {
            const exchangeRates = {};

            for (const [currency, rate] of Object.entries(exchangeRateData.rates)) {
                exchangeRates[currency] = (1 / rate).toFixed(2);
            }
            const userId = req.session.userId;
            const user = await client.db("users").collection("users").findOne({ _id: new ObjectId(userId) });

            await client.db("users").collection("currency").insertOne({
                userId: req.session.userId,
                username: user.username, 
                exchangeRates: exchangeRates,
                timestamp: new Date()
            });

            res.render('currency', { exchangeRates });
        } else {
            res.status(404).send("Exchange rate data not found");
        }
    } catch (error) {
        console.error('Error fetching exchange rate data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, function (response) {
            let data = '';
            response.on("data", function (chunk) {
                data += chunk;
            });
            response.on("end", () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (parseError) {
                    reject(parseError);
                }
            });
        }).on('error', function (error) {
            reject(error);
        });
    });
};
app.listen(3000, function () {
    console.log("Server is running on 3000 port");
});
