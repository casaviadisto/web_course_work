import React, { useState, useEffect } from 'react';
import DualRangeSlider from '../components/DualRangeSlider';
import AstronautCard from '../components/AstronautCard';
import './Astronauts.css';

const Astronauts = () => {
    const [astronauts, setAstronauts] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const [limits, setLimits] = useState({
        age: { min: 20, max: 90 },
        time: { min: 0, max: 1000 },
        evas: { min: 0, max: 20 },
        eva_time: { min: 0, max: 300 },
        loaded: false
    });

    const [filters, setFilters] = useState({
        search: '',
        country_id: '',
        gender: '',
        status: '', // Це поле вже було, тепер ми його використовуємо в UI
        min_age: 0, max_age: 100,
        min_time: 0, max_time: 1000,
        min_evas: 0, max_evas: 50,
        min_eva_time: 0, max_eva_time: 1000,
        sort_by: 'name',
        order: 'asc'
    });

    // 1. Завантаження довідників
    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/countries')
            .then(res => res.json())
            .then(data => setCountries(data));

        fetch('http://127.0.0.1:5000/api/metadata')
            .then(res => res.json())
            .then(data => {
                setTotalCount(data.total_count);
                setLimits({
                    age: data.age,
                    time: data.time_in_space,
                    evas: data.evas,
                    eva_time: data.eva_time,
                    loaded: true
                });

                setFilters(prev => ({
                    ...prev,
                    min_age: data.age.min, max_age: data.age.max,
                    min_time: data.time_in_space.min, max_time: data.time_in_space.max,
                    min_evas: data.evas.min, max_evas: data.evas.max,
                    min_eva_time: data.eva_time.min, max_eva_time: data.eva_time.max
                }));
            })
            .catch(err => console.error("Error loading metadata:", err));
    }, []);

    // 2. Живий пошук
    useEffect(() => {
        if (!limits.loaded) return;

        const fetchAstronauts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                Object.keys(filters).forEach(key => {
                    if (filters[key] !== '' && filters[key] !== null) {
                        params.append(key, filters[key]);
                    }
                });

                const response = await fetch(`http://127.0.0.1:5000/api/astronauts?${params.toString()}`);
                const data = await response.json();
                setAstronauts(data);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchAstronauts, 400);
        return () => clearTimeout(debounce);
    }, [filters, limits.loaded]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSortChange = (e) => {
        const [sortBy, order] = e.target.value.split('-');
        setFilters(prev => ({ ...prev, sort_by: sortBy, order: order }));
    };

    return (
        <div className="astronauts-page">
            <div className="top-bar glass-panel">
                <div className="header-text">
                    <h1>База Екіпажу</h1>
                    <p style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                        {loading ? 'Пошук...' : `Знайдено записів: ${astronauts.length} із ${totalCount}`}
                    </p>
                </div>
                <input
                    type="text"
                    name="search"
                    className="main-search"
                    placeholder="Пошук за іменем..."
                    value={filters.search}
                    onChange={handleFilterChange}
                />
            </div>

            <div className="main-layout">
                {/* --- СПИСОК КАРТОК --- */}
                <div className="cards-container">
                    {loading ? (
                        <div className="loading-text">Оновлення списку...</div>
                    ) : (
                        <div className="cards-grid">
                            {astronauts.map(astro => (
                                <AstronautCard key={astro.id} astro={astro} />
                            ))}
                        </div>
                    )}

                    {!loading && astronauts.length === 0 && (
                        <div className="empty-state">Нікого не знайдено за цими критеріями.</div>
                    )}
                </div>

                {/* --- САЙДБАР --- */}
                <div className="sidebar glass-panel">
                    <h2>Фільтри</h2>

                    <div className="filter-group">
                        <label>Сортування</label>
                        <select
                            value={`${filters.sort_by}-${filters.order}`}
                            onChange={handleSortChange}
                            style={{ border: '1px solid #f59e0b', color: '#fff' }}
                        >
                            <option value="name-asc">Ім'я (А-Я)</option>
                            <option value="name-desc">Ім'я (Я-А)</option>
                            <option value="age-asc">Вік (від молодих)</option>
                            <option value="age-desc">Вік (від старших)</option>
                        </select>
                    </div>

                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

                    <div className="filter-group">
                        <label>Країна</label>
                        <select name="country_id" value={filters.country_id} onChange={handleFilterChange}>
                            <option value="">Всі країни</option>
                            {countries.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Стать</label>
                        <select name="gender" value={filters.gender} onChange={handleFilterChange}>
                            <option value="">Будь-яка</option>
                            <option value="Male">Чоловік</option>
                            <option value="Female">Жінка</option>
                        </select>
                    </div>

                    {/* --- НОВИЙ БЛОК: СТАТУС --- */}
                    <div className="filter-group">
                        <label>Статус</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">Всі статуси</option>
                            <option value="Active">Активний (Active)</option>
                            <option value="Retired">У відставці (Retired)</option>
                            <option value="Deceased">Померлий (Deceased)</option>
                        </select>
                    </div>
                    {/* --------------------------- */}

                    {limits.loaded && (
                        <>
                            <div className="filter-group">
                                <label>Вік (років)</label>
                                <DualRangeSlider
                                    min={limits.age.min}
                                    max={limits.age.max}
                                    onChange={({ min, max }) => setFilters(prev => ({ ...prev, min_age: min, max_age: max }))}
                                    unit=" р."
                                />
                            </div>

                            <div className="filter-group">
                                <label>Час у космосі (днів)</label>
                                <DualRangeSlider
                                    min={limits.time.min}
                                    max={limits.time.max}
                                    onChange={({ min, max }) => setFilters(prev => ({ ...prev, min_time: min, max_time: max }))}
                                    unit=" д."
                                />
                            </div>

                            <div className="filter-group">
                                <label>Час в EVA (хвилин)</label>
                                <DualRangeSlider
                                    min={limits.eva_time.min}
                                    max={limits.eva_time.max}
                                    onChange={({ min, max }) => setFilters(prev => ({ ...prev, min_eva_time: min, max_eva_time: max }))}
                                    unit=" хв"
                                />
                            </div>

                            <div className="filter-group">
                                <label>Кількість виходів</label>
                                <DualRangeSlider
                                    min={limits.evas.min}
                                    max={limits.evas.max}
                                    onChange={({ min, max }) => setFilters(prev => ({ ...prev, min_evas: min, max_evas: max }))}
                                />
                            </div>
                        </>
                    )}

                    <button
                        className="reset-btn"
                        onClick={() => setFilters({
                            search: '', country_id: '', gender: '', status: '',
                            min_age: limits.age.min, max_age: limits.age.max,
                            min_time: limits.time.min, max_time: limits.time.max,
                            min_evas: limits.evas.min, max_evas: limits.evas.max,
                            min_eva_time: limits.eva_time.min, max_eva_time: limits.eva_time.max,
                            sort_by: 'name', order: 'asc'
                        })}
                    >
                        Скинути фільтри
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Astronauts;