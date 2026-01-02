import React, { useState, useEffect, useRef } from 'react';
import AstronautCard from '../components/AstronautCard';
import './Expeditions.css';

// --- ДАНІ ПРО ПЕРІОДИ (ЕРИ) ---
const EXPEDITION_ERAS = [
    {
        id: 'era-1',
        range: [1, 6],
        title: "Експедиції з 1-ї по 6-ту",
        description: "Екіпаж першої довготривалої експедиції прибув на станцію 2 листопада 2000 року на російському кораблі «Союз ТМ-31». Згодом екіпажі доставлялися «Спейс шатлами», а «Союзи» використовувалися як рятувальні капсули. Заміну «Союзу» раз на пів року забезпечували експедиції відвідування. До шостої експедиції екіпажі складалися з трьох осіб. Екіпаж МКС-6 був змушений повернутися на кораблі-рятувальнику «Союз ТМА-1» через призупинення польотів шатлів після загибелі «Колумбії» 1 лютого 2003 року."
    },
    {
        id: 'era-2',
        range: [7, 12],
        title: "Експедиції з 7-ї по 12-ту",
        description: "Після загибелі шатла «Колумбія» 1 лютого 2003 року запуски шатлів були призупинені до липня 2005 року. Ротація екіпажів МКС здійснювалася лише кораблями «Союз ТМА» до липня 2006 року. Кількість членів екіпажу було зменшено з трьох до двох через недостатні можливості доставки вантажів і провіанту (єдиним засобом доставки залишився російський «Прогрес»). При цьому третє крісло в «Союзі» діставалося учасникам експедицій відвідування."
    },
    {
        id: 'era-3',
        range: [13, 19],
        title: "Експедиції з 13-ї по 19-ту",
        description: "26 липня 2005 року вперше після катастрофи здійснено запуск шатла до МКС. Майже рік по тому шатл «Діскавері» доставив астронавта ЄКА Томаса Райтера, і екіпаж знову збільшився до трьох осіб. Заміна командира і першого бортінженера здійснювалася «Союзами», а другий бортінженер прибував на шатлах. Починаючи з 13-ї експедиції, тривалість перебування окремих членів екіпажу може відрізнятися від тривалості самої експедиції."
    },
    {
        id: 'era-4',
        range: [20, 21],
        title: "Експедиції з 20-ї по 21-шу",
        description: "МКС-19 стала останньою експедицією зі штатним екіпажем із трьох осіб. Починаючи з 20-ї, штатний екіпаж складається з шести осіб (іноді — з п'яти), при цьому кожні 2–4 місяці відбувається зміна трьох членів. Експедиції 20 і 21 стали останніми, в яких для ротації екіпажу використовувалися шатли перед завершенням програми «Спейс шатл»."
    },
    {
        id: 'era-5',
        range: [22, 62],
        title: "Експедиції з 22-ї по 62-гу",
        description: "Програма «Спейс шатл» завершена. Ротація екіпажів експедицій здійснювалася виключно за допомогою російських кораблів «Союз»."
    },
    {
        id: 'era-6',
        range: [63, 70],
        title: "Експедиції з 63-ї по 70-ту",
        description: "Починаючи з 63-ї експедиції, ротація екіпажів виконується не тільки за допомогою «Союзів», а й за допомогою нового американського пілотованого корабля Crew Dragon компанії SpaceX."
    },
    {
        id: 'era-7',
        range: [71, 1000],
        title: "Експедиції, починаючи з 71-ї",
        description: "Починаючи з 71-ї експедиції, в ротації екіпажів МКС вперше використовується пілотований космічний корабель CST-100 Starliner американської корпорації Boeing."
    }
];

// --- Компонент однієї експедиції ---
const ExpeditionItem = ({ exp }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className="expedition-block glass-panel">
            <div className="exp-header">
                <h2>Експедиція {exp.id}</h2>
                <div className="exp-dates">
                    <span>{exp.began || '???'}</span> — <span>{exp.ended || 'Active'}</span>
                </div>
            </div>

            <div className="exp-stats">
                <div className="stat-item">
                    <label>Тривалість</label>
                    <span>{exp.duration || '-'}</span>
                </div>
                <div className="stat-item">
                    <label>Орбіти</label>
                    <span>{exp.orbits || '-'}</span>
                </div>
                <div className="stat-item">
                    <label>Відстань</label>
                    <span>{exp.distance || '-'}</span>
                </div>
                <div className="stat-item">
                    <label>Екіпаж</label>
                    <span>{exp.crew_size} осіб</span>
                </div>
            </div>

            <button
                className={`crew-toggle-btn ${isOpen ? 'open' : ''}`}
                onClick={toggleOpen}
            >
                <span>{isOpen ? 'Приховати екіпаж' : 'Показати склад екіпажу'}</span>
                <span className="arrow">▼</span>
            </button>

            {isOpen && (
                <div className="exp-crew-section">
                    {exp.crew && exp.crew.length > 0 ? (
                        <div className="crew-grid">
                            {exp.crew.map(member => (
                                <AstronautCard key={member.id} astro={member} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-crew">Дані про екіпаж відсутні</div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Компонент блоку ЕРИ (З логікою Intersection Observer) ---
const EraSection = ({ era, expeditions }) => {
    const [isEraOpen, setIsEraOpen] = useState(false);
    const [showFloatingBtn, setShowFloatingBtn] = useState(false); // Стан видимості кнопки
    const eraHeaderRef = useRef(null); // Реф для заголовка

    // Ефект для відстеження видимості заголовка
    useEffect(() => {
        if (!isEraOpen) {
            setShowFloatingBtn(false);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Якщо заголовок НЕ видимий (ми проскролили вниз), показуємо кнопку
                setShowFloatingBtn(!entry.isIntersecting);
            },
            {
                root: null, // вікно браузера
                threshold: 0, // спрацьовує, як тільки 1 піксель заголовка зникає/з'являється
                rootMargin: "-20px 0px 0px 0px" // невеликий відступ зверху
            }
        );

        if (eraHeaderRef.current) {
            observer.observe(eraHeaderRef.current);
        }

        return () => {
            if (eraHeaderRef.current) {
                observer.unobserve(eraHeaderRef.current);
            }
        };
    }, [isEraOpen]);

    if (expeditions.length === 0) return null;

    const handleCollapseEra = (e) => {
        e.stopPropagation();
        if (eraHeaderRef.current) {
            eraHeaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setIsEraOpen(false);
        setShowFloatingBtn(false);
    };

    return (
        <div className="era-section">
            {/* Заголовок ери (за ним ми стежимо) */}
            <div
                ref={eraHeaderRef}
                className={`era-header glass-panel ${isEraOpen ? 'active' : ''}`}
                onClick={() => setIsEraOpen(!isEraOpen)}
            >
                <div className="era-title-row">
                    <h2>{era.title}</h2>
                    <span className={`era-arrow ${isEraOpen ? 'open' : ''}`}>▼</span>
                </div>
                <p>{era.description}</p>
            </div>

            {isEraOpen && (
                <div className="era-content-wrapper">
                    <div className="expeditions-list">
                        {expeditions.map(exp => (
                            <ExpeditionItem key={exp.id} exp={exp} />
                        ))}
                    </div>

                    {/* ПЛАВАЮЧА КНОПКА (тільки якщо showFloatingBtn === true) */}
                    {showFloatingBtn && (
                        <button
                            className="floating-collapse-btn glass-panel"
                            onClick={handleCollapseEra}
                            title="Згорнути еру"
                        >
                            <span className="icon">▲</span>
                            <span className="text">Згорнути</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Головний компонент ---
const Expeditions = () => {
    const [expeditions, setExpeditions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/expeditions')
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a, b) => a.id - b.id);
                setExpeditions(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading expeditions:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="expeditions-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-text">Завантаження експедицій...</div>
            </div>
        );
    }

    return (
        <div className="expeditions-page">
            <div className="top-bar glass-panel">
                <div className="top-bar-content">
                    <h1>Експедиції МКС</h1>
                    <p>Хронологія місій та еволюція екіпажів</p>
                </div>
            </div>

            <div className="eras-container">
                {EXPEDITION_ERAS.map(era => {
                    const eraExpeditions = expeditions.filter(
                        exp => exp.id >= era.range[0] && exp.id <= era.range[1]
                    );

                    return (
                        <EraSection
                            key={era.id}
                            era={era}
                            expeditions={eraExpeditions}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Expeditions;