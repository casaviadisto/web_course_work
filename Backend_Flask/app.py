import os
import re
from datetime import datetime
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ===========================
# НАЛАШТУВАННЯ ПІДКЛЮЧЕННЯ
# ===========================

db_name = 'iss.db'
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'instance', db_name)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Таблиця зв'язку (Many-to-Many)
crew_expeditions = db.Table('crew_expeditions',
                            db.Column('crew_id', db.Integer, db.ForeignKey('crew.id'), primary_key=True),
                            db.Column('expedition_id', db.Integer, db.ForeignKey('expeditions.id'), primary_key=True)
                            )


# ===========================
# МОДЕЛІ
# ===========================

class Country(db.Model):
    __tablename__ = 'countries'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text)
    flag_url = db.Column(db.Text)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "flag_url": self.flag_url}


class Expedition(db.Model):
    __tablename__ = 'expeditions'
    id = db.Column(db.Integer, primary_key=True)
    began = db.Column(db.Text)
    ended = db.Column(db.Text)
    duration = db.Column(db.Text)
    distance = db.Column(db.Text)
    orbits = db.Column(db.Text)
    crew_size = db.Column(db.Text)

    def to_dict(self):
        crew_list = [member.to_dict() for member in self.crew_members]

        return {
            "id": self.id,
            "began": self.began,
            "ended": self.ended,
            "duration": self.duration,
            "distance": self.distance,
            "orbits": self.orbits,
            "crew_size": self.crew_size,
            "crew": crew_list
        }


class Crew(db.Model):
    __tablename__ = 'crew'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id'))
    gender = db.Column(db.Text)
    is_alive = db.Column(db.Text)
    specialization = db.Column(db.Text)
    time_in_space = db.Column(db.Text)
    total_evas = db.Column(db.Float)
    total_eva_time = db.Column(db.Text)  # Текстове поле "10h 30m"
    status = db.Column(db.Text)
    birth_year = db.Column(db.Integer)
    death_year = db.Column(db.Float)
    photo_url = db.Column(db.Text)
    about = db.Column(db.Text)

    country = db.relationship('Country', backref='astronauts')
    expeditions = db.relationship('Expedition', secondary=crew_expeditions, backref='crew_members')

    def to_dict(self):
        # --- Логіка розрахунку віку ---
        age = None
        if self.birth_year:
            if self.death_year:
                age = int(self.death_year) - self.birth_year
            else:
                current_year = datetime.now().year
                age = current_year - self.birth_year

        return {
            "id": self.id,
            "name": self.name,
            "country": self.country.name if self.country else None,
            "country_flag": self.country.flag_url if self.country else None,
            "gender": self.gender,
            "is_alive": self.is_alive,
            "specialization": self.specialization,
            "time_in_space": self.time_in_space,
            "total_evas": self.total_evas,
            "total_eva_time": self.total_eva_time,
            "status": self.status,
            "photo_url": self.photo_url,
            "about": self.about,
            "birth_year": self.birth_year,
            "age": age,
            "expeditions": [e.id for e in self.expeditions]
        }


# ===========================
# API (МАРШРУТИ)
# ===========================

@app.route('/api/countries')
def get_countries():
    return jsonify([c.to_dict() for c in Country.query.all()])


@app.route('/api/metadata')
def get_metadata():
    """
    Повертає min/max значення для слайдерів, базуючись на реальних даних БД.
    """
    all_crew = Crew.query.all()

    evas_values = []  # Кількість виходів
    ages_values = []  # Вік
    time_values = []  # Час у космосі (дні)
    eva_time_values = []  # Час в EVA (хвилини)

    current_year = datetime.now().year

    for astro in all_crew:
        # 1. Total EVAs (якщо None -> 0)
        if astro.total_evas is not None:
            evas_values.append(astro.total_evas)
        else:
            evas_values.append(0)

        # 2. Age
        if astro.birth_year:
            if astro.death_year:
                age = int(astro.death_year) - astro.birth_year
            else:
                age = current_year - astro.birth_year
            ages_values.append(age)

        # 3. Time in Space (Days) - Парсинг "123d" або "123 days"
        days = 0
        if astro.time_in_space:
            match = re.search(r'(\d+)\s*d', astro.time_in_space)
            if match:
                days = int(match.group(1))
        time_values.append(days)

        # 4. EVA Time (Minutes) - Парсинг "10h 30m"
        eva_minutes = 0
        if astro.total_eva_time:
            h_match = re.search(r'(\d+)h', astro.total_eva_time)
            m_match = re.search(r'(\d+)m', astro.total_eva_time)
            h = int(h_match.group(1)) if h_match else 0
            m = int(m_match.group(1)) if m_match else 0
            eva_minutes = h * 60 + m
        eva_time_values.append(eva_minutes)

    meta = {
        "total_count": len(all_crew),
        "age": {
            "min": min(ages_values) if ages_values else 20,
            "max": max(ages_values) if ages_values else 80
        },
        "time_in_space": {
            "min": min(time_values) if time_values else 0,
            "max": max(time_values) if time_values else 1000
        },
        "evas": {
            "min": min(evas_values) if evas_values else 0,
            "max": max(evas_values) if evas_values else 20
        },
        "eva_time": {
            "min": min(eva_time_values) if eva_time_values else 0,
            "max": max(eva_time_values) if eva_time_values else 300
        }
    }
    return jsonify(meta)


@app.route('/api/astronauts')
def get_astronauts():
    search = request.args.get('search')
    country_id = request.args.get('country_id')
    gender = request.args.get('gender')
    status = request.args.get('status')

    min_evas = request.args.get('min_evas', type=float)
    max_evas = request.args.get('max_evas', type=float)

    min_age = request.args.get('min_age', type=int)
    max_age = request.args.get('max_age', type=int)

    min_time = request.args.get('min_time', type=int)
    max_time = request.args.get('max_time', type=int)

    min_eva_time = request.args.get('min_eva_time', type=int)
    max_eva_time = request.args.get('max_eva_time', type=int)

    sort_by = request.args.get('sort_by', 'name')  # name, age
    order = request.args.get('order', 'asc')  # asc, desc

    query = Crew.query

    if search:
        query = query.filter(Crew.name.contains(search))
    if gender:
        query = query.filter(Crew.gender == gender)
    if status:
        query = query.filter(Crew.status == status)
    if country_id:
        query = query.filter(Crew.country_id == country_id)

    results = query.all()
    filtered_results = []

    current_year = datetime.now().year

    for astro in results:
        is_match = True

        age = None
        if astro.birth_year:
            if astro.death_year:
                age = int(astro.death_year) - astro.birth_year
            else:
                age = current_year - astro.birth_year

        if min_age is not None and (age is None or age < min_age): is_match = False
        if max_age is not None and (age is None or age > max_age): is_match = False

        days = 0
        if astro.time_in_space:
            match = re.search(r'(\d+)\s*d', astro.time_in_space)
            if match:
                days = int(match.group(1))

        if min_time is not None and days < min_time: is_match = False
        if max_time is not None and days > max_time: is_match = False

        evas = astro.total_evas if astro.total_evas is not None else 0.0
        if min_evas is not None and evas < min_evas: is_match = False
        if max_evas is not None and evas > max_evas: is_match = False

        eva_minutes = 0
        if astro.total_eva_time:
            h_match = re.search(r'(\d+)h', astro.total_eva_time)
            m_match = re.search(r'(\d+)m', astro.total_eva_time)
            h = int(h_match.group(1)) if h_match else 0
            m = int(m_match.group(1)) if m_match else 0
            eva_minutes = h * 60 + m

        if min_eva_time is not None and eva_minutes < min_eva_time: is_match = False
        if max_eva_time is not None and eva_minutes > max_eva_time: is_match = False

        if is_match:
            filtered_results.append(astro)


    json_results = [a.to_dict() for a in filtered_results]

    reverse_sort = (order == 'desc')

    if sort_by == 'name':
        json_results.sort(key=lambda x: x['name'], reverse=reverse_sort)
    elif sort_by == 'age':
        json_results.sort(key=lambda x: x['age'] if x['age'] is not None else -1, reverse=reverse_sort)

    return jsonify(json_results)


@app.route('/api/astronauts/<int:id>')
def get_astronaut_detail(id):
    astronaut = Crew.query.get_or_404(id)
    data = astronaut.to_dict()
    data['expeditions_details'] = [e.to_dict() for e in astronaut.expeditions]
    return jsonify(data)


@app.route('/api/expeditions')
def get_expeditions():
    expeditions = Expedition.query.order_by(Expedition.id.desc()).all()
    return jsonify([e.to_dict() for e in expeditions])


@app.route('/api/expeditions/<int:id>')
def get_expedition_detail(id):
    exp = Expedition.query.get_or_404(id)
    return jsonify(exp.to_dict())


if __name__ == '__main__':
    app.run(debug=True, port=5000)