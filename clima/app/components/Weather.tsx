'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import '../styles/weather-effects.css';

interface WeatherData {
    name: string;
    sys: { country: string };
    weather: Array<{ icon: string; description: string; main: string; id: number }>;
    main: { temp: number; humidity: number };
    wind: { speed: number };
    coord: { lat: number; lon: number };
    timezone: number; // Offset from UTC in seconds
}

export default function Weather() {
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [localTime, setLocalTime] = useState(new Date());

    const API_KEY = 'ce5458feb41bafa59423c9e800c7b422';

    useEffect(() => {
        // Cargar favoritos del localStorage al iniciar
        const storedFavorites = localStorage.getItem('favoriteCities');
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }

        // Actualizar la hora cada segundo
        const timer = setInterval(() => {
            if (weather) {
                // Calcular la hora local de la ciudad seleccionada
                const localDate = new Date();
                const utc = localDate.getTime() + (localDate.getTimezoneOffset() * 60000);
                setLocalTime(new Date(utc + (weather.timezone * 1000)));
            } else {
                setLocalTime(new Date());
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [weather]);

    const formatTime = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('es-ES', options);
    };

    const getWeatherClass = (weatherId: number): string => {
        if (weatherId >= 200 && weatherId < 300) return 'thunder-bg';
        if (weatherId >= 300 && weatherId < 600) return 'rain-bg';
        if (weatherId >= 600 && weatherId < 700) return 'snow-bg';
        if (weatherId >= 700 && weatherId < 800) return 'mist-bg';
        if (weatherId === 800) return 'clear-sky';
        if (weatherId > 800) return 'clouds-bg';
        return 'clear-sky';
    };

    const getWeatherEffect = (weatherId: number) => {
        if (weatherId >= 200 && weatherId < 300) {
            return (
                <>
                    <div className="rain" />
                    <div className="thunder" />
                    <div className="lightning" />
                </>
            );
        }
        if (weatherId >= 300 && weatherId < 600) return <div className="rain" />;
        if (weatherId >= 600 && weatherId < 700) return <div className="snow" />;
        if (weatherId === 800) return <div className="sun" />;
        if (weatherId > 800) return <div className="clouds" />;
        return null;
    };

    const fetchWeather = async (cityName: string) => {
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
            );
            const data = await res.json();
            
            if (data.cod !== 200) {
                throw new Error(data.message);
            }
            
            setWeather(data);
            setCity('');
        } catch (err: any) {
            setError(err.message || 'Error al obtener el clima');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (city.trim()) {
            fetchWeather(city);
        }
    };

    const addToFavorites = () => {
        if (!weather) return;
        
        const cityName = weather.name;
        if (favorites.includes(cityName)) {
            setError('Esta ciudad ya está en favoritos');
            return;
        }

        if (favorites.length >= 5) {
            setError('Ya tienes el máximo de 5 ciudades favoritas');
            return;
        }

        const newFavorites = [...favorites, cityName];
        setFavorites(newFavorites);
        localStorage.setItem('favoriteCities', JSON.stringify(newFavorites));
    };

    const removeFromFavorites = (cityName: string) => {
        const newFavorites = favorites.filter(fav => fav !== cityName);
        setFavorites(newFavorites);
        localStorage.setItem('favoriteCities', JSON.stringify(newFavorites));
    };

    return (
        <div className={`weather-container ${weather ? getWeatherClass(weather.weather[0].id) : 'clear-sky'}`}>
            {weather && getWeatherEffect(weather.weather[0].id)}
            
            <div className="container mx-auto px-4 py-10">
                <div className="flex flex-col items-center justify-center mb-8">
                    <h1 className="text-4xl font-bold text-center text-white mb-2">
                        Consulta el Clima
                    </h1>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-white/90 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg mb-2">
                            {formatTime(localTime)}
                        </div>
                        {weather && (
                            <div className="text-lg text-white/80">
                                {formatDate(localTime)}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="max-w-md mx-auto p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                    <form onSubmit={handleSubmit} className="mb-6">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ingresa una ciudad..."
                                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                required
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                disabled={loading}
                            >
                                {loading ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>
                    </form>

                    {/* Lista de favoritos */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Ciudades Favoritas</h3>
                        <div className="flex flex-wrap gap-2">
                            {favorites.map((favCity) => (
                                <div
                                    key={favCity}
                                    className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                                >
                                    <button
                                        onClick={() => fetchWeather(favCity)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        {favCity}
                                    </button>
                                    <button
                                        onClick={() => removeFromFavorites(favCity)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {weather && (
                        <div className="text-center">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold">{weather.name}, {weather.sys.country}</h2>
                                <button
                                    onClick={addToFavorites}
                                    className="text-yellow-500 hover:text-yellow-600 text-2xl"
                                    title="Agregar a favoritos"
                                >
                                    ★
                                </button>
                            </div>
                            <div className="flex items-center justify-center mb-4">
                                <Image
                                    src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                                    alt={weather.weather[0].description}
                                    width={100}
                                    height={100}
                                />
                            </div>
                            <p className="text-4xl font-bold mb-4">{Math.round(weather.main.temp)}°C</p>
                            <p className="text-xl capitalize mb-2">{weather.weather[0].description}</p>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="bg-gray-100/80 backdrop-blur-sm p-3 rounded-lg">
                                    <p className="text-sm text-gray-500">Humedad</p>
                                    <p className="font-bold">{weather.main.humidity}%</p>
                                </div>
                                <div className="bg-gray-100/80 backdrop-blur-sm p-3 rounded-lg">
                                    <p className="text-sm text-gray-500">Viento</p>
                                    <p className="font-bold">{weather.wind.speed} m/s</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 