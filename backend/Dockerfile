# Dockerfile

# 1. Java base image
FROM eclipse-temurin:17-jdk

# 2. JAR dosyasını container’a kopyala
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# 3. Uygulamayı başlat
ENTRYPOINT ["java", "-jar", "/app.jar"]
