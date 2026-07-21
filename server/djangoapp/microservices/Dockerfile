FROM python:3.9.18-slim-bookworm
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py ./
COPY sentiment ./sentiment
EXPOSE 5050
CMD ["gunicorn", "--bind", "0.0.0.0:5050", "app:app"]
