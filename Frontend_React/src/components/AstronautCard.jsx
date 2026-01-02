import React from 'react';
import { useNavigate } from 'react-router-dom'; // Імпортуємо хук навігації
import './AstronautCard.css';

const AstronautCard = ({ astro }) => {
    const navigate = useNavigate();

    // Функція переходу
    const handleClick = () => {
        navigate(`/astronauts/${astro.id}`);
    };

    return (
        <div className="astro-card glass-panel" onClick={handleClick} style={{ cursor: 'pointer' }}>
            <div className="card-photo">
                {astro.photo_url ? (
                    <img src={astro.photo_url} alt={astro.name} />
                ) : (
                    <div className="no-photo">No Photo</div>
                )}

                <div className={`status-badge ${astro.status === 'Active' ? 'active' : ''}`}>
                    {astro.status}
                </div>
            </div>

            <div className="card-info">
                <h3>{astro.name}</h3>

                <div className="country-row">
                    {astro.country_flag && (
                        <img src={astro.country_flag} alt="flag" className="flag-icon" />
                    )}
                    <span>{astro.country || 'Unknown'}</span>
                </div>

                <div className="specs-mini">
                    {astro.age && (
                        <div>Вік: <span>{astro.age} р.</span></div>
                    )}
                    <div>У космосі: <span>{astro.time_in_space || '0'}</span></div>

                    {(astro.total_evas > 0 || astro.total_eva_time) && (
                        <>
                            <div>Виходи: <span>{astro.total_evas || 0}</span></div>
                            <div>Час EVA: <span>{astro.total_eva_time || '0h 0m'}</span></div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AstronautCard;