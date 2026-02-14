FROM python:3.12-slim

# 🔥 OS timezone database 설치
RUN apt-get update && \
    apt-get install -y tzdata && \
    rm -rf /var/lib/apt/lists/*

# 🔥 Python tzdata fallback 설치
RUN pip install --no-cache-dir tzdata

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV TZ=UTC

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
