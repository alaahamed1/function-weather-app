import React, { useEffect, useState } from "react";



function getWeatherIcon(wmoCode) {
    const icons = new Map([
        [[0], "☀️"],
        [[1], "🌤"],
        [[2], "⛅️"],
        [[3], "☁️"],
        [[45, 48], "🌫"],
        [[51, 56, 61, 66, 80], "🌦"],
        [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
        [[71, 73, 75, 77, 85, 86], "🌨"],
        [[95], "🌩"],
        [[96, 99], "⛈"],
    ]);
    const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
    if (!arr) return "NOT FOUND";
    return icons.get(arr);
}

function convertToFlag(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
    return new Intl.DateTimeFormat("en", {
        weekday: "short",
    }).format(new Date(dateStr));
}






export default function AppN() {
    const [location, setLocation] = useState("egypt");
    const [isLoading, setIsLoading] = useState(false)
    const [displayLocation, setDisplayLocation] = useState("");
    const [weather, setWeather] = useState({});





    const fetchWeather = async () => {
        if (location.length < 2) {
            setWeather({});
            return;
        }
        try {
            setIsLoading(true);

            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
            );
            const geoData = await geoRes.json();

            if (!geoData.results) throw new Error("Location not found");

            const { latitude, longitude, timezone, name, country_code } =
                geoData.results.at(0);

            setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
            );
            const weatherData = await weatherRes.json();
            setWeather(weatherData.daily);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        setLocation(localStorage.getItem('location') || "");
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (location !== localStorage.getItem('location')) {
                await fetchWeather();
                localStorage.setItem('location', location);
            }
        };

        fetchData();
    }, [location]);



    return (
        <div className="app">
            <h1>function Weather app </h1>
            <Input location={location} onChangeLocation={(e) => setLocation(e.target.value)} />
            {isLoading && <div className="loader">Loading...</div>}
            {weather.weathercode && (
                <Weather
                    location={displayLocation}
                    weather={weather}
                />
            )}
        </div>
    );
}


function Input({ location, onChangeLocation }) {
    return (
        <div>
            <input
                type="text"
                placeholder="Search For Location.."
                value={location}
                onChange={onChangeLocation}
            />
        </div>
    );
}

function Weather({ location, weather }) {
    const {
        temperature_2m_max: max,
        temperature_2m_min: min,
        time: dates,
        weathercode: codes,
    } = weather;
    return (
        <div>
            <h2>Weather {location}</h2>
            <ul className="weather">
                {dates.map((date, i) => (
                    <Day
                        date={date}
                        max={max.at(i)}
                        min={min.at(i)}
                        code={codes.at(i)}
                        key={date}
                        isToday={i === 0}
                    />
                ))}
            </ul>
        </div>
    )
}
function Day({ date, max, min, code, isToday }) {
    return (
        <li className="day">
            <span>{getWeatherIcon(code)}</span>
            <p>{isToday ? "Today" : formatDay(date)}</p>
            <p>{Math.floor(min)}&deg; <strong>&mdash; {Math.ceil(max)}&deg;</strong></p>
        </li>
    );
}