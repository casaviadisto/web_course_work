import React, { useState, useEffect } from 'react';
import Slider from '@mui/material/Slider';
import './DualRangeSlider.css';

const DualRangeSlider = ({ min, max, onChange, unit = "" }) => {
    const [value, setValue] = useState([min, max]);
    const [minInput, setMinInput] = useState(min);
    const [maxInput, setMaxInput] = useState(max);

    useEffect(() => {
        setValue([min, max]);
        setMinInput(min);
        setMaxInput(max);
    }, [min, max]);

    const handleSliderChange = (event, newValue) => {
        setValue(newValue);
        setMinInput(newValue[0]);
        setMaxInput(newValue[1]);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onChange({ min: value[0], max: value[1] });
        }, 500);
        return () => clearTimeout(timer);
    }, [value]); // eslint-disable-line

    const handleMinBlur = () => {
        let val = Number(minInput);
        if (val < min) val = min;
        if (val > value[1]) val = value[1];

        const newValue = [val, value[1]];
        setValue(newValue);
        setMinInput(val);
    };

    const handleMaxBlur = () => {
        let val = Number(maxInput);
        if (val > max) val = max;
        if (val < value[0]) val = value[0];

        const newValue = [value[0], val];
        setValue(newValue);
        setMaxInput(val);
    };

    const handleKeyDown = (e, handler) => {
        if (e.key === 'Enter') {
            handler();
            e.target.blur();
        }
    };

    return (
        <div className="slider-wrapper">
            <div className="slider-header">
                <div className="input-wrap">
                    <span>від</span>
                    <input
                        type="number"
                        value={minInput}
                        onChange={(e) => setMinInput(e.target.value)}
                        onBlur={handleMinBlur}
                        onKeyDown={(e) => handleKeyDown(e, handleMinBlur)}
                    />
                </div>
                <div className="input-wrap">
                    <span>до</span>
                    <input
                        type="number"
                        value={maxInput}
                        onChange={(e) => setMaxInput(e.target.value)}
                        onBlur={handleMaxBlur}
                        onKeyDown={(e) => handleKeyDown(e, handleMaxBlur)}
                    />
                    <span>{unit}</span>
                </div>
            </div>

            <div className="slider-container-mui">
                <Slider
                    getAriaLabel={() => 'Range slider'}
                    value={value}
                    min={min}
                    max={max}
                    onChange={handleSliderChange}

                    // ЗМІНА ТУТ: Вимикаємо "краплю"
                    valueLabelDisplay="off"

                    disableSwap
                    sx={{
                        color: '#f59e0b',
                        height: 6,
                        padding: '13px 0',
                        '& .MuiSlider-thumb': {
                            height: 18,
                            width: 18,
                            backgroundColor: '#fff',
                            border: '2px solid #f59e0b',
                            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                                boxShadow: 'inherit',
                            },
                            '&:before': {
                                display: 'none',
                            },
                        },
                        '& .MuiSlider-track': {
                            border: 'none',
                            height: 6,
                        },
                        '& .MuiSlider-rail': {
                            opacity: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            height: 6,
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default DualRangeSlider;