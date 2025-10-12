# Algo-net

[![DOI](https://zenodo.org/badge/1030922488.svg)](https://doi.org/10.5281/zenodo.17333020)


Etkileşimli graph düzenleyici ve algoritma çalıştırma platformu.

- Frontend: React (Vite), MUI, react-konva
- Backend: Spring Boot (PostgreSQL, JWT)
- Python Servis: Django + Gunicorn (PULP ile optimizasyon)

## Hızlı Başlangıç

- Backend
  - .env yapılandırın (DB, JWT, CORS).
  - Çalıştırın: `./gradlew bootRun`
  - Varsayılan: http://localhost:8080

- Frontend
  - Kurulum: `npm install`
  - Çalıştırın: `npm run dev`
  - Python servisi adresi: `VITE_PYTHON_BASE=http://localhost:8000`
  - Backend API adresi: `VITE_API_BASE=http://localhost:8080`

- Python (Django + Gunicorn)
  - Kurulum: `pip install django djangorestframework django-cors-headers gunicorn pulp numpy`
  - Geliştirme: `python manage.py runserver 0.0.0.0:8000`
  - Üretim örneği: `gunicorn <django_proje_adi>.wsgi:application --bind 0.0.0.0:8000 --workers 2`
  - Endpoint: `POST /api/run/` (multipart/form-data: file, Vertices, Edges)

## Notlar

- CORS: Backend `CORS_ALLOWED_ORIGIN` ile frontend portu eşleşmelidir.
- Kaydet/Yükle: Graph’ı DB’ye kaydetme ve id ile yükleme desteklenir.
- Hata Bildirimi: Frontend’de hata durumları 2 sn FlashMessage ile gösterilir.
- Optimizasyon: Ayrık graph’larda sonsuz mesafelere (np.inf) dikkat edin.

## Lisans

Bu proje GPL-2.0 lisansı altındadır. Ayrıntılar için LICENSE dosyasına bakın.
