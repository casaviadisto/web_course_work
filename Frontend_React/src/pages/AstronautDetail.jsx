import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AstronautDetail.css';

const AstronautDetail = () => {
    const { id } = useParams(); // Отримуємо ID з URL
    const navigate = useNavigate();
    const [astro, setAstro] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/astronauts/${id}`)
            .then(res => res.json())
            .then(data => {
                setAstro(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error:", err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="loading-text">Завантаження досьє...</div>;
    if (!astro) return <div className="loading-text">Космонавта не знайдено</div>;

    return (
        <div className="astro-detail-page">
            {/* Кнопка Назад */}
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Назад
            </button>

            <div className="detail-container glass-panel">
                {/* ЛІВА ЧАСТИНА: Фото та основні дані */}
                <div className="detail-sidebar">
                    <div className="detail-photo-wrapper">
                        {astro.photo_url ? (
                            <img src={astro.photo_url} alt={astro.name} className="detail-photo" />
                        ) : (
                            <div className="no-photo-detail">No Photo</div>
                        )}
                        <div className={`detail-status ${astro.status === 'Active' ? 'active' : ''}`}>
                            {astro.status}
                        </div>
                    </div>

                    <div className="detail-main-info">
                        <h1>{astro.name}</h1>
                        <div className="detail-country">
                            {astro.country_flag && <img src={astro.country_flag} alt="flag" />}
                            <span>{astro.country}</span>
                        </div>
                        <div className="detail-spec">
                            {astro.specialization || 'Спеціаліст місії'}
                        </div>
                    </div>
                </div>

                {/* ПРАВА ЧАСТИНА: Статистика та Біографія */}
                <div className="detail-content">

                    {/* СТАТИСТИКА (ГРІД) */}
                    <div className="stats-box">
                        <div className="stat-cell">
                            <label>Вік</label>
                            <span>{astro.age ? `${astro.age} років` : 'Невідомо'}</span>
                        </div>
                        <div className="stat-cell">
                            <label>Стать</label>
                            <span>{astro.gender === 'Male' ? 'Чоловік' : 'Жінка'}</span>
                        </div>
                        <div className="stat-cell">
                            <label>Час у космосі</label>
                            <span className="highlight">{astro.time_in_space || '0 днів'}</span>
                        </div>
                        <div className="stat-cell">
                            <label>Виходів (EVA)</label>
                            <span>{astro.total_evas || 0}</span>
                        </div>
                        <div className="stat-cell">
                            <label>Час у відкритому космосі</label>
                            <span>{astro.total_eva_time || '0h 0m'}</span>
                        </div>
                        <div className="stat-cell">
                            <label>Рік народження</label>
                            <span>{astro.birth_year || '-'}</span>
                        </div>
                    </div>

                    {/* БІОГРАФІЯ */}
                    <div className="bio-section">
                        <h2>Біографія</h2>
                        <p>{astro.about || "Інформація про біографію відсутня."}</p>
                    </div>

                    {/* УЧАСТЬ В ЕКСПЕДИЦІЯХ */}
                    <div className="missions-section">
                        <h2>Експедиції ({astro.expeditions_details?.length || 0})</h2>
                        <div className="missions-list">
                            {astro.expeditions_details && astro.expeditions_details.length > 0 ? (
                                astro.expeditions_details.map(exp => (
                                    <div key={exp.id} className="mission-tag">
                                        <span className="mission-id">Expedition {exp.id}</span>
                                        <span className="mission-date">
                                            {exp.began ? exp.began.split(' ')[0] : '...'}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <span className="no-data">Немає даних про експедиції</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AstronautDetail;