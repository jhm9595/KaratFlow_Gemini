import os

gradle_path = 'backend/build.gradle'
with open(gradle_path, 'r') as f:
    gradle = f.read()

gradle = gradle.replace("runtimeOnly 'org.postgresql:postgresql'", "runtimeOnly 'org.postgresql:postgresql'\n\truntimeOnly 'com.h2database:h2'")

with open(gradle_path, 'w') as f:
    f.write(gradle)

yaml_path = 'backend/src/main/resources/application.yml'
with open(yaml_path, 'w') as f:
    f.write('''spring:
  datasource:
    url: jdbc:h2:mem:karatflow;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
    username: sa
    password: 
    driver-class-name: org.h2.Driver
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    show-sql: true
  flyway:
    enabled: true
    baseline-on-migrate: true
    url: jdbc:h2:mem:karatflow;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
    user: sa
    password: 

server:
  port: 8080
''')

print("Switched to H2 in-memory database for immediate running.")
