import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = 3000;

//Api key control
if (!process.env.API_KEY) {
    console.error('API Key is missing. Please set it in .env file.');
    process.exit(1);
}

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


const buildWeatherUrl = (location) =>
    `http://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.API_KEY}`;

const buildWeatherDailyUrl = (location) =>
    `http://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${process.env.API_KEY}`;

const buildIconUrl = (icon) =>
    `http://openweathermap.org/img/wn/${icon}@2x.png`; 


app.get('/', (req, res) => {
    res.render('index.ejs');
});


app.post('/getweather', async (req, res) => {
    const location = req.body.location;
    const url = buildWeatherUrl(location);
    const urlDaily = buildWeatherDailyUrl(location);
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, '0'); 
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    try {
        const response = await axios.get(url);
        const { main, weather, name } = response.data;
        const { temp } = main;
        const { description, icon } = weather[0];
        const temperature = Math.round(temp - 273.15);

        const responseDaily = await axios.get(urlDaily);
        const  list  = responseDaily.data.list;
        const dailyForecast = list.filter(item => item.dt_txt.includes('12:00:00') );
        const dailyDay = dailyForecast.map(item => item.dt_txt.split(' ')[0]);
        
        const dailyTemperature = dailyForecast.map(item => Math.round(item.main.temp - 273.15));
        const descriptionDaily = dailyForecast.map(item => item.weather[0].description);
        const iconDaily = dailyForecast.map(item => item.weather[0].icon);

     function getDayByName(day){
        const date = new Date(day); 
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
     }
     const dailyDayName = dailyDay.map(day =>getDayByName(day)); 
     console.log(dailyDayName);

        console.log(descriptionDaily);
        console.log(iconDaily);
        console.log(dailyTemperature);
        res.render('weather.ejs', {
            temp: temperature,
            description: description,
            icon: buildIconUrl(icon), 
            location: name,
            hour: hour,
            minute: minute,
            dailyTemp: dailyTemperature,
            dailyDesc : descriptionDaily,
            dailyIcon : iconDaily.map(icon => buildIconUrl(icon)),
            dailyDayName : dailyDayName
        });
    } catch (error) {
        console.error(error.message);
        if (error.response && error.response.status === 404) {
            res.send({ error: 'Location not found. Please try again.' });
        } else {
            res.send({ error: 'An unexpected error occurred. Please try again later.' });
        }
    }
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});


app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on http://localhost:${port}`);
});
