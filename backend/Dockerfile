# 1. Build stage: Gradle kullanarak projeyi derle
FROM gradle:7.6-jdk17 AS build

WORKDIR /app

# Gradle cache için klasör oluştur (isteğe bağlı hız için)
VOLUME /home/gradle/.gradle

# Proje dosyalarını kopyala
COPY . /app

# Projeyi derle (jar oluştur)
RUN gradle clean build --no-daemon

# 2. Run stage: Çalışma ortamı, sadece JRE ile
FROM eclipse-temurin:17-jre

WORKDIR /app

# Build stage’den jar dosyasını kopyala
COPY --from=build /app/build/libs/*.jar app.jar

# Uygulamayı başlat
ENTRYPOINT ["java", "-jar", "app.jar"]
