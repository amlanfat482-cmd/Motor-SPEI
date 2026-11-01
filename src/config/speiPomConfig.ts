export const SPEI_POM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>

    <groupId>com.fintech.spei</groupId>
    <artifactId>spei-disperser-engine</artifactId>
    <version>1.0.0-RELEASE</version>
    <name>spei-disperser-engine</name>
    <description>Motor de Dispersión y Liquidación SPEI Mainnet de Alta Disponibilidad (Banxico / STP) con Idempotencia por Clave de Rastreo, Webhooks HMAC-SHA256 y Reconciliación de Limbo</description>

    <properties>
        <java.version>21</java.version>
        <bouncycastle.version>1.78.1</bouncycastle.version>
        <redisson.version>3.35.0</redisson.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    </properties>

    <dependencies>
        <!-- Spring Boot Web Starter for Sync API & Asynchronous Webhook Endpoints -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Boot Validation for Mexican CLABE, PAN and Dimo Format Checks -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Spring Boot Security for Mutual TLS (mTLS) and OAuth2 / JWT Protection -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- Redis & Redisson for Distributed Idempotency Locks on Clave de Rastreo -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.redisson</groupId>
            <artifactId>redisson-spring-boot-starter</artifactId>
            <version>\${redisson.version}</version>
        </dependency>

        <!-- Spring Data JPA & PostgreSQL Driver for Acid Ledger and Audit Trail -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Bouncy Castle for Cryptographic HMAC-SHA256 and X.509 Banxico Seals -->
        <dependency>
            <groupId>org.bouncycastle</groupId>
            <artifactId>bcpkix-jdk18on</artifactId>
            <version>\${bouncycastle.version}</version>
        </dependency>
        <dependency>
            <groupId>org.bouncycastle</groupId>
            <artifactId>bcprov-jdk18on</artifactId>
            <version>\${bouncycastle.version}</version>
        </dependency>

        <!-- Jackson XML Dataformat for Banxico CEP & Acuse Processing -->
        <dependency>
            <groupId>com.fasterxml.jackson.dataformat</groupId>
            <artifactId>jackson-dataformat-xml</artifactId>
        </dependency>

        <!-- Spring Boot Actuator & Prometheus for Mainnet Latency and SLA Telemetry -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Test Suite -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <layers>
                        <enabled>true</enabled>
                    </layers>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;

export const SPEI_APPLICATION_YML = `# Spring Boot 3.3.4 Configuration for SPEI Mainnet Disperser Engine
spring:
  application:
    name: spei-disperser-engine
  threads:
    virtual:
      enabled: true # Java 21 Project Loom: libera hilos del SO en HTTP 202

  datasource:
    url: jdbc:postgresql://localhost:5432/spei_mainnet_db
    username: spei_operator
    password: \${SPEI_DB_PASSWORD}
    hikari:
      maximum-pool-size: 30
      minimum-idle: 10

  data:
    redis:
      host: \${REDIS_HOST:localhost}
      port: 6379
      timeout: 2000ms

spei:
  provider:
    base-url: https://api.spei-mainnet.banxico.org.mx/v1
    connect-timeout-ms: 3000
    read-timeout-ms: 4000
    client-id: \${SPEI_CLIENT_ID}
    client-secret: \${SPEI_CLIENT_SECRET}
  security:
    webhook-hmac-secret: \${SPEI_WEBHOOK_HMAC_SECRET}
    max-clock-skew-seconds: 300
    idempotency-ttl-seconds: 300
  reconciliation:
    cron-expression: "0 * * * * *" # Cada 60 segundos
    limbo-threshold-minutes: 5
    batch-size: 50
`;
