import { useState, useEffect, useRef } from 'react';
import * as satellite from 'satellite.js';

// --- Чисті математичні функції ---

export const toRad = (deg) => deg * Math.PI / 180;
export const toDeg = (rad) => rad * 180 / Math.PI;

/**
 * Розраховує позицію МКС для заданого часу на основі TLE (satRec)
 */
export const getISSPosition = (satRec, date) => {
    if (!satRec) return null;

    const prop = satellite.propagate(satRec, date);
    if (!prop.position || !prop.velocity) return null;

    const gmst = satellite.gstime(date);
    const posGd = satellite.eciToGeodetic(prop.position, gmst);

    const lat = satellite.degreesLat(posGd.latitude);
    const lng = satellite.degreesLong(posGd.longitude);
    const alt = posGd.height;
    const speed = Math.sqrt(Math.pow(prop.velocity.x, 2) + Math.pow(prop.velocity.y, 2) + Math.pow(prop.velocity.z, 2));

    return {
        lat,
        lng,
        alt,
        speed: speed * 3600, // км/год
        time: date
    };
};

// --- Кастомний Хук (React Hook) ---

export const useISSTracker = () => {
    const [telemetry, setTelemetry] = useState({
        lat: 0, lng: 0, alt: 0, speed: 0, time: new Date()
    });
    const [status, setStatus] = useState("Ініціалізація...");
    const satRecRef = useRef(null); // Зберігаємо satRec, щоб не передавати його через state постійно

    // 1. Завантаження TLE (один раз при старті)
    useEffect(() => {
        const fetchTLE = async () => {
            setStatus("Перевірка даних...");
            let tleData = null;
            const CACHE_KEY = 'iss_tle_data';
            const CACHE_TIME_KEY = 'iss_tle_timestamp';
            const MAX_AGE = 2 * 60 * 60 * 1000; // 2 години

            // Кеш
            const cachedData = localStorage.getItem(CACHE_KEY);
            const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
            const now = new Date().getTime();

            let useCache = false;
            if (cachedData && cachedTime) {
                if (now - parseInt(cachedTime, 10) < MAX_AGE) {
                    useCache = true;
                    tleData = JSON.parse(cachedData);
                }
            }

            // Мережа
            if (!useCache) {
                let fetched = false;
                // Спроба 1: WhereTheIss
                try {
                    setStatus("Оновлення (WhereTheIss)...");
                    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544/tles');
                    if (res.ok) {
                        const json = await res.json();
                        tleData = { l1: json.line1, l2: json.line2 };
                        fetched = true;
                    }
                } catch (e) { console.warn("API 1 failed", e); }

                // Спроба 2: Celestrak
                if (!fetched) {
                    try {
                        setStatus("Оновлення (Celestrak)...");
                        const res = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE'));
                        if (res.ok) {
                            const text = await res.text();
                            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                            let l1 = lines.find(l => l.startsWith('1 '));
                            let l2 = lines.find(l => l.startsWith('2 '));
                            if (l1 && l2) {
                                tleData = { l1, l2 };
                                fetched = true;
                            }
                        }
                    } catch (e) { console.warn("API 2 failed", e); }
                }

                // Збереження
                if (fetched && tleData) {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(tleData));
                    localStorage.setItem(CACHE_TIME_KEY, now.toString());
                    setStatus("");
                } else if (cachedData) {
                    tleData = JSON.parse(cachedData);
                    setStatus("Офлайн режим (кеш)");
                }
            }

            // Фоллбек
            if (!tleData) {
                tleData = {
                    l1: "1 25544U 98067A   24060.00000000  .00016717  00000+0  10270-3 0  9990",
                    l2: "2 25544  51.6442 209.6558 0005013 100.1234 250.6789 15.49500000 12345"
                };
                setStatus("Офлайн режим (резерв)");
            } else if (useCache || (!status.includes("Офлайн") && !status.includes("Ініціалізація"))) {
                setStatus("");
            }

            // Ініціалізація satellite.js
            if (tleData) {
                satRecRef.current = satellite.twoline2satrec(tleData.l1, tleData.l2);
            }
        };

        fetchTLE();
    }, []);

    // 2. Таймер оновлення позиції (1 сек)
    useEffect(() => {
        const interval = setInterval(() => {
            if (satRecRef.current) {
                const now = new Date();
                const data = getISSPosition(satRecRef.current, now);
                if (data) {
                    setTelemetry(data);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return { telemetry, status, satRec: satRecRef.current };
};