import React, { useEffect, useState, useMemo } from 'react';
import '@google/model-viewer';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

import issGlb from '../assets/model/ISS_stationary.glb?url';
import issUsdz from '../assets/model/ISS_stationary.usdz?url';
import AstronautCard from '../components/AstronautCard';
import './Home.css';

const Home = () => {
    const [crew, setCrew] = useState([]);
    const [allAstronauts, setAllAstronauts] = useState([]);
    const [currentExpedition, setCurrentExpedition] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Всі космонавти (для статистики)
                const allAstronautsRes = await fetch('http://127.0.0.1:5000/api/astronauts');
                const allAstronautsData = await allAstronautsRes.json();
                setAllAstronauts(allAstronautsData);

                // 2. Експедиції (для поточної місії)
                const expeditionsRes = await fetch('http://127.0.0.1:5000/api/expeditions');
                const expeditionsData = await expeditionsRes.json();

                if (expeditionsData.length > 0) {
                    const latestExpedition = expeditionsData[0];
                    setCurrentExpedition(latestExpedition);
                    setCrew(latestExpedition.crew || []);
                }
            } catch (error) {
                console.error("Помилка отримання даних:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- СТАТИСТИКА (useMemo) ---
    const genderData = useMemo(() => {
        let male = 0;
        let female = 0;
        allAstronauts.forEach(a => {
            if (a.gender === 'Male') male++;
            else if (a.gender === 'Female') female++;
        });
        return [
            { name: 'Чоловіки', value: male },
            { name: 'Жінки', value: female }
        ];
    }, [allAstronauts]);

    const countryData = useMemo(() => {
        const counts = {};
        allAstronauts.forEach(a => {
            let country = a.country || 'Unknown';
            if (country === 'United States') country = 'USA';
            if (country === 'United Kingdom') country = 'UK';
            if (country === 'United Arab Emirates') country = 'UAE';
            counts[country] = (counts[country] || 0) + 1;
        });

        return Object.keys(counts)
            .map(key => ({ name: key, count: counts[key] }))
            .sort((a, b) => b.count - a.count);
    }, [allAstronauts]);

    const COLORS = ['#38bdf8', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="home-container">
            {/* --- 0. ЗАГОЛОВОК --- */}
            <header className="header">
                <h1>ISS Tracker Dashboard</h1>
                <p>Моніторинг Міжнародної космічної станції в реальному часі</p>
            </header>

            {/* --- 1. ОПИС (Що це таке?) --- */}
            <section className="section-block">
                <div className="about-section glass-panel">
                    <h2 className="specs-title" style={{ marginTop: 0 }}>Про станцію</h2>
                    <div className="about-text">
                        <p>
                            <strong>Міжнаро́дна космі́чна ста́нція (МКС)</strong> — пілотована космічна станція на орбіті Землі, створена для наукових досліджень у космосі.
                        </p>
                        <p>
                            Будівництво розпочалось 1998 року і тривало у співробітництві аерокосмічних агентств Росії, США, Японії, Канади, Бразилії та Євросоюзу. Маса станції постійно змінюється та становить приблизно 470 т. МКС обертається навколо Землі на висоті приблизно 415 км, здійснюючи 15,77 обертів за добу, рухається з середньою швидкістю 27 700 км/год.
                        </p>
                        <p>
                            За угодою, кожному учаснику проєкту належать його сегменти на МКС. Російська Федерація володіє модулями «Звєзда» і «Пірс», Японія — модулем «Кібо», Європейське космічне агентство — модулем Columbus. Сонячні панелі та інші модулі належать НАСА.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- 2. ХАРАКТЕРИСТИКИ (ТТХ) --- */}
            <div className="section-block">
                <div className="specs-section glass-panel">
                    <h2 className="specs-title" style={{ marginTop: 0 }}>Технічні характеристики</h2>
                    <ul className="specs-list">
                        <li><span className="specs-label">Початок експлуатації:</span> 20 листопада 1998 року</li>
                        <li><span className="specs-label">Маса:</span> ~470 000 кг</li>
                        <li><span className="specs-label">Довжина:</span> 109 м</li>
                        <li><span className="specs-label">Ширина:</span> 73,15 м (з фермами)</li>
                        <li><span className="specs-label">Висота:</span> 27,4 м</li>
                        <li><span className="specs-label">Житловий об’єм:</span> 916 м³</li>
                        <li><span className="specs-label">Тиск:</span> 1 атм.</li>
                        <li><span className="specs-label">Температура:</span> ~26,9 °C (всередині)</li>
                        <li><span className="specs-label">Потужність:</span> 110 кВт (сонячні батареї)</li>
                    </ul>
                </div>
            </div>

            {/* --- 3. ВІЗУАЛІЗАЦІЯ (3D Модель) --- */}
            <section className="section-block">
                <h2 className="section-title">3D Візуалізація</h2>
                <div className="model-container glass-panel">
                    <model-viewer
                        src={issGlb}
                        ios-src={issUsdz}
                        alt="3D модель МКС"
                        auto-rotate
                        camera-controls
                        ar
                        shadow-intensity="1"
                        camera-orbit="45deg 55deg 150m"
                        style={{ width: '100%', height: '600px' }}
                    >
                    </model-viewer>
                </div>
            </section>

            {/* --- 4. ПОТОЧНА МІСІЯ ТА ЕКІПАЖ --- */}
            <section className="section-block">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>
                        Поточна місія та Екіпаж
                    </h2>

                    {/* Інфо про місію тепер тут */}
                    {currentExpedition && (
                        <div className="current-mission-badge glass-panel">
                            <span className="mission-label">Місія:</span>
                            <span className="mission-value">Expedition {currentExpedition.id}</span>
                            <span className="mission-dates" style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#8b9bb4' }}>
                                {currentExpedition.began || 'Start'} — {currentExpedition.ended || 'Now'}
                            </span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="loading-text">Отримання даних з МКС...</div>
                ) : (
                    <>
                        {crew.length > 0 ? (
                            <div className="active-crew-grid">
                                {crew.map(astro => (
                                    <AstronautCard key={astro.id} astro={astro} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">Дані про екіпаж відсутні</div>
                        )}
                    </>
                )}
            </section>

            {/* --- 5. СТАТИСТИКА (Графіки) --- */}
            {!loading && allAstronauts.length > 0 && (
                <section className="section-block">
                    <h2 className="section-title">
                        Глобальна статистика (Всього космонавтів: {allAstronauts.length})
                    </h2>
                    <div className="charts-container">

                        {/* Графік 1: Стать */}
                        <div className="chart-wrapper glass-panel">
                            <h3>Гендерний розподіл</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={genderData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {genderData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0b0d17', borderColor: '#38bdf8', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Графік 2: Країни */}
                        <div className="chart-wrapper glass-panel">
                            <h3>Географія учасників</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={countryData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#8b9bb4"
                                            fontSize={11}
                                            angle={-25}
                                            textAnchor="end"
                                            height={70}
                                            interval={0}
                                        />
                                        <YAxis stroke="#8b9bb4" allowDecimals={false} />
                                        <Tooltip
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                            contentStyle={{ backgroundColor: '#0b0d17', borderColor: '#38bdf8', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="count" name="Кількість" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                                            {countryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </section>
            )}
        </div>
    );
};

export default Home;