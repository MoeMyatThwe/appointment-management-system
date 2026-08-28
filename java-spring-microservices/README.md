## Production operations

Run the production overlay only with secrets supplied through the environment:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Create database backups from Windows PowerShell with
`.\scripts\backup-databases.ps1`, or use `scripts/backup-databases.sh` on Linux.
Backups should be copied to durable off-host storage and periodically restored in
a separate environment.

Enable local Prometheus monitoring with:

```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

The CI workflow runs backend tests, frontend lint/build, and Trivy filesystem
scanning on every pull request and push to `main`.


# appointment Service

---

## Environment Variables

```
JAVA_TOOL_OPTIONS=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005;
SPRING_DATASOURCE_PASSWORD=password;
SPRING_DATASOURCE_URL=jdbc:postgresql://appointment-service-db:5432/db;
SPRING_DATASOURCE_USERNAME=admin_user;
SPRING_JPA_HIBERNATE_DDL_AUTO=validate;
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true;
SPRING_FLYWAY_BASELINE_VERSION=0;
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092;
```

# Billing Service

---

## gRPC Setup

Add the following to the `<dependencies>` section
```
<!--GRPC -->
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-netty-shaded</artifactId>
    <version>1.69.0</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-protobuf</artifactId>
    <version>1.69.0</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-stub</artifactId>
    <version>1.69.0</version>
</dependency>
<dependency> <!-- necessary for Java 9+ -->
    <groupId>org.apache.tomcat</groupId>
    <artifactId>annotations-api</artifactId>
    <version>6.0.53</version>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>net.devh</groupId>
    <artifactId>grpc-spring-boot-starter</artifactId>
    <version>3.1.0.RELEASE</version>
</dependency>
<dependency>
    <groupId>com.google.protobuf</groupId>
    <artifactId>protobuf-java</artifactId>
    <version>4.29.1</version>
</dependency>

```

Replace the `<build>` section with the following

```

<build>
    <extensions>
        <!-- Ensure OS compatibility for protoc -->
        <extension>
            <groupId>kr.motd.maven</groupId>
            <artifactId>os-maven-plugin</artifactId>
            <version>1.7.0</version>
        </extension>
    </extensions>
    <plugins>
        <!-- Spring boot / maven  -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>

        <!-- PROTO -->
        <plugin>
            <groupId>org.xolstice.maven.plugins</groupId>
            <artifactId>protobuf-maven-plugin</artifactId>
            <version>0.6.1</version>
            <configuration>
                <protocArtifact>com.google.protobuf:protoc:3.25.5:exe:${os.detected.classifier}</protocArtifact>
                <pluginId>grpc-java</pluginId>
                <pluginArtifact>io.grpc:protoc-gen-grpc-java:1.68.1:exe:${os.detected.classifier}</pluginArtifact>
            </configuration>
            <executions>
                <execution>
                    <goals>
                        <goal>compile</goal>
                        <goal>compile-custom</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>

```

# appointment Service

---

## Environment Variables (complete list)
```bash
BILLING_SERVICE_ADDRESS=billing-service;
BILLING_SERVICE_GRPC_PORT=9005;
JAVA_TOOL_OPTIONS=-agentlib:jdwp\=transport\=dt_socket,server\=y,suspend\=n,address\=*:5005;
SPRING_DATASOURCE_PASSWORD=password;
SPRING_DATASOURCE_URL=jdbc:postgresql://appointment-service-db:5432/db;
SPRING_DATASOURCE_USERNAME=admin_user;
SPRING_JPA_HIBERNATE_DDL_AUTO=validate;
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true;
SPRING_FLYWAY_BASELINE_VERSION=0;
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092;
```


## gRPC Setup

Add the following to the `<dependencies>` section
```
<!--GRPC -->
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-netty-shaded</artifactId>
    <version>1.69.0</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-protobuf</artifactId>
    <version>1.69.0</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-stub</artifactId>
    <version>1.69.0</version>
</dependency>
<dependency> <!-- necessary for Java 9+ -->
    <groupId>org.apache.tomcat</groupId>
    <artifactId>annotations-api</artifactId>
    <version>6.0.53</version>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>net.devh</groupId>
    <artifactId>grpc-spring-boot-starter</artifactId>
    <version>3.1.0.RELEASE</version>
</dependency>
<dependency>
    <groupId>com.google.protobuf</groupId>
    <artifactId>protobuf-java</artifactId>
    <version>4.29.1</version>
</dependency>

```

Replace the `<build>` section with the following

```

<build>
    <extensions>
        <!-- Ensure OS compatibility for protoc -->
        <extension>
            <groupId>kr.motd.maven</groupId>
            <artifactId>os-maven-plugin</artifactId>
            <version>1.7.0</version>
        </extension>
    </extensions>
    <plugins>
        <!-- Spring boot / maven  -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>

        <!-- PROTO -->
        <plugin>
            <groupId>org.xolstice.maven.plugins</groupId>
            <artifactId>protobuf-maven-plugin</artifactId>
            <version>0.6.1</version>
            <configuration>
                <protocArtifact>com.google.protobuf:protoc:3.25.5:exe:${os.detected.classifier}</protocArtifact>
                <pluginId>grpc-java</pluginId>
                <pluginArtifact>io.grpc:protoc-gen-grpc-java:1.68.1:exe:${os.detected.classifier}</pluginArtifact>
            </configuration>
            <executions>
                <execution>
                    <goals>
                        <goal>compile</goal>
                        <goal>compile-custom</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>

```

## Kafka Container

Copy/paste this line into the environment variables when running the container in intellij
```
KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092,EXTERNAL://localhost:9094;KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER;KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093;KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT,PLAINTEXT:PLAINTEXT;KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094;KAFKA_CFG_NODE_ID=0;KAFKA_CFG_PROCESS_ROLES=controller,broker
```

## Kafka Producer Setup (appointment Service)

Add the following to `application.properties`
```
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.value-deserializer=org.apache.kafka.common.serialization.ByteArrayDeserializer
```


# Notification Service

---

## Environment Vars

```
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
```

## Protobuf/Kafka 

Dependencies (add in addition to whats there)

```
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
    <version>3.3.0</version>
</dependency>

<dependency>
    <groupId>com.google.protobuf</groupId>
    <artifactId>protobuf-java</artifactId>
    <version>4.29.1</version>
</dependency>
```

Update the build section in pom.xml with the following

```
    <build>
        <extensions>
            <!-- Ensure OS compatibility for protoc -->
            <extension>
                <groupId>kr.motd.maven</groupId>
                <artifactId>os-maven-plugin</artifactId>
                <version>1.7.0</version>
            </extension>
        </extensions>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>

            <plugin>
                <groupId>org.xolstice.maven.plugins</groupId>
                <artifactId>protobuf-maven-plugin</artifactId>
                <version>0.6.1</version>
                <configuration>
                    <protocArtifact>com.google.protobuf:protoc:3.25.5:exe:${os.detected.classifier}</protocArtifact>
                    <pluginId>grpc-java</pluginId>
                    <pluginArtifact>io.grpc:protoc-gen-grpc-java:1.68.1:exe:${os.detected.classifier}</pluginArtifact>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>compile</goal>
                            <goal>compile-custom</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
```


# Auth service

Dependencies (add in addition to whats there)

```
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.6.0</version>
        </dependency>
        <dependency>
          <groupId>com.h2database</groupId>
          <artifactId>h2</artifactId>
        </dependency>
       
```

## Auth Service DB

### Environment Variables
```bash
POSTGRES_DB=db;POSTGRES_PASSWORD=password;POSTGRES_USER=admin_user
```

## Environment Variables

```
SPRING_DATASOURCE_PASSWORD=password
SPRING_DATASOURCE_URL=jdbc:postgresql://auth-service-db:5432/db
SPRING_DATASOURCE_USERNAME=admin_user
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
SPRING_FLYWAY_BASELINE_VERSION=0
```


## Database migrations

Auth migrations are in `auth-service/src/main/resources/db/migration`, and appointment
migrations are in `appointment-service/src/main/resources/db/migration`. New migrations
must use Flyway versioned names such as `V3__add_appointment_field.sql`; do not modify
an already-applied migration. Existing local databases are baselined at version `0`, so
the initial migrations run once while preserving existing appointment data.


# Auth Service DB

## Environment Variables

```
POSTGRES_DB=db;POSTGRES_PASSWORD=password;POSTGRES_USER=admin_user
```
