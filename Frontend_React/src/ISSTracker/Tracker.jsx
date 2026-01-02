import React, { useEffect, useRef, useState } from 'react';
import * as satellite from 'satellite.js';
import './Tracker.css';
import { useISSTracker, toRad, toDeg } from '../utils/trackerMath';

// Імпорти зображень
import mapDayImg from '../assets/tracker/mapday.jpg';
import mapNightImg from '../assets/tracker/mapnight.jpg';
import issIconImg from '../assets/tracker/iss.png';
import sunIconImg from '../assets/tracker/sun.png';
import orbitFwdImg from '../assets/tracker/orbitfwd.png';
import orbitBwdImg from '../assets/tracker/orbitbwd.png';

const ISSTracker = () => {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const imagesRef = useRef({});

    // Стан розмірів
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const { telemetry, status, satRec } = useISSTracker();

    // 1. ResizeObserver: Встановлюємо правильні пропорції (2:1)
    useEffect(() => {
        if (!wrapperRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const width = Math.floor(entry.contentRect.width);
                // Встановлюємо висоту як половину ширини (пропорція карти 2:1)
                const height = Math.floor(width / 2);

                setDimensions({ width, height });
            }
        });

        resizeObserver.observe(wrapperRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // 2. Завантаження картинок
    useEffect(() => {
        const loadImages = async () => {
            const loadImage = (src) => new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
            });

            const [day, night, iss, sun, orbitFwd, orbitBwd] = await Promise.all([
                loadImage(mapDayImg), loadImage(mapNightImg), loadImage(issIconImg),
                loadImage(sunIconImg), loadImage(orbitFwdImg), loadImage(orbitBwdImg)
            ]);
            imagesRef.current = { day, night, iss, sun, orbitFwd, orbitBwd };
        };
        loadImages();
    }, []);

    // 3. Рендер Canvas
    useEffect(() => {
        if (!satRec || !imagesRef.current.day || dimensions.width === 0) return;

        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            // Оновлюємо розміри канвасу
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;

            const { width, height } = canvas;
            const { day, night, iss, sun, orbitFwd, orbitBwd } = imagesRef.current;

            const now = telemetry.time || new Date();

            const lonToX = (lon) => ((lon + 180) % 360) * (width / 360);
            const lonToXRaw = (lon) => (lon + 180) * (width / 360);
            const latToY = (lat) => (90 - lat) * (height / 180);

            let arrowsToDraw = [];

            // A. Розрахунки
            const utcHours = now.getUTCHours() + now.getUTCMinutes()/60 + now.getUTCSeconds()/3600;
            const sunLongDeg = (12 - utcHours) * 15;
            const startOfYear = new Date(now.getUTCFullYear(), 0, 0);
            const diff = now - startOfYear;
            const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
            const sunLatDeg = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * toRad(1));

            const futureTime = new Date(now.getTime() + 2000);
            const propFut = satellite.propagate(satRec, futureTime);
            const posFutGd = satellite.eciToGeodetic(propFut.position, satellite.gstime(futureTime));
            const issLonNext = satellite.degreesLong(posFutGd.longitude);
            const issLatNext = satellite.degreesLat(posFutGd.latitude);

            // B. Фон
            ctx.drawImage(night, 0, 0, width, height);
            ctx.save();
            ctx.beginPath();
            const accuracy = 2;
            for (let x = 0; x <= width; x += accuracy) {
                const lon = (x / width) * 360 - 180;
                const lambda = toRad(lon);
                const sunLambda = toRad(sunLongDeg);
                const sunPhi = toRad(sunLatDeg);
                const epsilon = 1e-4;
                const tanSunPhi = Math.abs(sunPhi) < epsilon ? epsilon : Math.tan(sunPhi);
                const latRad = Math.atan(-Math.cos(lambda - sunLambda) / tanSunPhi);
                const y = latToY(toDeg(latRad));
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            if (sunLatDeg < 0) { ctx.lineTo(width, height); ctx.lineTo(0, height); }
            else { ctx.lineTo(width, 0); ctx.lineTo(0, 0); }
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(day, 0, 0, width, height);
            ctx.restore();

            // C. Сонце
            const sunX = lonToX(sunLongDeg); const sunY = latToY(sunLatDeg);
            ctx.drawImage(sun, sunX - 20, sunY - 20, 40, 40);

            // D. Орбіти
            const drawOrbitLines = (minutes, color, arrowImg, flipArrow = false) => {
                ctx.strokeStyle = color; ctx.lineWidth = 2;
                ctx.beginPath();
                let isFirst = true;
                let lastX=0, lastY=0, prevX=0, prevY=0;
                const step = minutes > 0 ? 1 : -1;
                const limit = minutes > 0 ? 90 : -90;

                for (let i = 0; Math.abs(i) <= Math.abs(limit); i+=step) {
                    const t = new Date(now.getTime() + i * 60000);
                    const p = satellite.propagate(satRec, t);
                    if (p.position) {
                        const g = satellite.eciToGeodetic(p.position, satellite.gstime(t));
                        const curLon = satellite.degreesLong(g.longitude);
                        const curLat = satellite.degreesLat(g.latitude);
                        const lx = lonToX(curLon);
                        const ly = latToY(curLat);
                        if (isFirst) { ctx.moveTo(lx, ly); isFirst = false; prevX=lx; prevY=ly; }
                        else {
                            if (Math.abs(lx - prevX) > width / 2) {
                                ctx.stroke(); ctx.beginPath(); ctx.moveTo(lx, ly);
                            } else { ctx.lineTo(lx, ly); }
                        }
                        prevX = lastX; prevY = lastY; lastX = lx; lastY = ly;
                    }
                }
                ctx.stroke();
                if (arrowImg && Math.abs(lastX - prevX) < width/2) {
                    const angle = Math.atan2(lastY - prevY, lastX - prevX);
                    arrowsToDraw.push({ img: arrowImg, x: lastX, y: lastY, angle: angle, flip: flipArrow });
                }
            };
            drawOrbitLines(90, '#FFFFFF', orbitFwd, false);
            drawOrbitLines(-90, '#FFFF00', orbitBwd, true);

            // E. Горизонт
            const drawHorizonCircle = (lonOffsetDeg) => {
                ctx.beginPath();
                const angularRadius = toRad(18);
                const clat = toRad(telemetry.lat);
                const clon = toRad(telemetry.lng);
                for(let i = 0; i <= 360; i+=5) {
                    const bearing = toRad(i);
                    const latRad = Math.asin(Math.sin(clat)*Math.cos(angularRadius) + Math.cos(clat)*Math.sin(angularRadius)*Math.cos(bearing));
                    const lonRad = clon + Math.atan2(Math.sin(bearing)*Math.sin(angularRadius)*Math.cos(clat), Math.cos(angularRadius)-Math.sin(clat)*Math.sin(latRad));
                    let degLon = toDeg(lonRad) + lonOffsetDeg;
                    const px = lonToXRaw(degLon);
                    const py = latToY(toDeg(latRad));
                    if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            };
            ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 3; ctx.fillStyle = 'transparent';
            drawHorizonCircle(0);
            if (telemetry.lng > 120) drawHorizonCircle(-360);
            if (telemetry.lng < -120) drawHorizonCircle(360);

            // F. Стрілки
            arrowsToDraw.forEach(arrow => {
                ctx.save();
                ctx.translate(arrow.x, arrow.y);
                ctx.rotate(arrow.angle + (arrow.flip ? Math.PI : 0));
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
                const arrowSz = 50;
                const xOffset = arrow.flip ? -20 : -35;
                const yShift = arrow.flip ? 15 : -15;
                ctx.drawImage(arrow.img, xOffset, (-arrowSz/2) + yShift, arrowSz, arrowSz);
                ctx.restore();
            });

            // G. МКС
            const issX = lonToX(telemetry.lng);
            const issY = latToY(telemetry.lat);

            const markerSize = 15;
            // ctx.strokeStyle = '#FF0000'; ctx.lineWidth = 3; ctx.shadowBlur = 0;
            // ctx.beginPath();
            // ctx.moveTo(issX - markerSize, issY); ctx.lineTo(issX + markerSize, issY);
            // ctx.moveTo(issX, issY - markerSize); ctx.lineTo(issX, issY + markerSize);
            // ctx.stroke();

            const issNextX = lonToX(issLonNext); const issNextY = latToY(issLatNext);
            ctx.save(); ctx.translate(issX, issY);
            if (Math.abs(issNextX - issX) < width / 2) {
                let angle = Math.atan2(issNextY - issY, issNextX - issX);
                ctx.rotate(angle + Math.PI / 2);
            }
            const issSz = 60;
            ctx.drawImage(iss, -issSz/2, -issSz/2, issSz, issSz);
            ctx.restore();
        };

        requestAnimationFrame(render);
    }, [telemetry, satRec, dimensions]);

    return (
        <div className="iss-tracker-container">
            <div className="iss-tracker-canvas-wrapper" ref={wrapperRef}>
                <canvas
                    ref={canvasRef}
                    className="iss-tracker-canvas"
                />
            </div>

            <div className="iss-tracker-footer">
                <div className="data-block">
                    <div className="data-item"><span className="data-label">Latitude</span><span className="data-value">{Math.abs(telemetry.lat).toFixed(1)} {telemetry.lat >= 0 ? 'N' : 'S'}</span></div>
                    <div className="data-item"><span className="data-label">Longitude</span><span className="data-value">{Math.abs(telemetry.lng).toFixed(1)} {telemetry.lng >= 0 ? 'E' : 'W'}</span></div>
                    <div className="data-item"><span className="data-label">Altitude</span><span className="data-value">{telemetry.alt.toFixed(0)} km</span></div>
                    <div className="data-item"><span className="data-label">Speed</span><span className="data-value">{telemetry.speed.toFixed(0)} km/h</span></div>
                </div>
                <div className="time-block"><span className="data-label">Time (GMT)</span><br/><span className="data-value">{telemetry.time.toUTCString().replace('GMT', '')}</span></div>
            </div>
            {status && <div className="status-overlay">{status}</div>}
        </div>
    );
};

export default ISSTracker;