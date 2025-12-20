# Stage 1: Build the application
FROM eclipse-temurin:22-jdk-jammy AS build
WORKDIR /app

# Copy gradle files for caching
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Copy source code
COPY src src

# Build the app, skipping tests for speed
RUN ./gradlew bootJar -x test

# Stage 2: Run the application
FROM eclipse-temurin:22-jre-jammy
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# Expose the port Spring Boot runs on
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]