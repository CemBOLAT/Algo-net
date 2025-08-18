# 1) Build stage
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Gradle wrapper ve ayar dosyalarını kopyala
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# Kaynak kodu kopyala
COPY src ./src

# Wrapper çalıştır
RUN chmod +x ./gradlew
# İsterseniz -x test ile testleri atlayabilirsiniz
RUN ./gradlew clean build -x test --no-daemon --stacktrace

# 2) Run stage
FROM eclipse-temurin:17-jre AS run
WORKDIR /app
# Derlenen jar'ı kopyala (wildcard ile)
COPY --from=build /app/build/libs/*.jar app.jar

# Render (veya başka PaaS) PORT değişkeni set eder, Spring Boot bunu okuyacaksa
ENV JAVA_OPTS=""
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]