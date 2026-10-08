package com.couplechef.storage;

import com.couplechef.Application;
import com.couplechef.storage.model.IngredientRequest;
import com.couplechef.storage.model.IngredientView;
import com.couplechef.storage.service.StorageService;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

@EnabledIfEnvironmentVariable(named = "TEST_DB_URL", matches = "jdbc:postgresql:.*")
class PostgresPersistenceTests {
    private ConfigurableApplicationContext start() {
        return new SpringApplicationBuilder(Application.class).web(WebApplicationType.NONE).run();
    }

    @Test
    void inventoryAndMigrationsSurviveApplicationRestart() throws Exception {
        IngredientView saved;
        try (var first = start()) {
            try (var connection = first.getBean(DataSource.class).getConnection()) {
                assertThat(connection.getMetaData().getDatabaseProductName()).isEqualTo("PostgreSQL");
            }
            var info = first.getBean(Flyway.class).info();
            assertThat(info.pending()).isEmpty();
            assertThat(info.current().getVersion().toString()).isEqualTo("2");
            saved = first.getBean(StorageService.class).create(new IngredientRequest(
                "持久化-" + UUID.randomUUID(), new BigDecimal("1.250"), "kg", "冷藏", "蔬菜",
                LocalDate.of(2026, 10, 20), null));
        }

        // The first application and connection pool are closed before a new instance starts.
        try (var second = start()) {
            StorageService service = second.getBean(StorageService.class);
            try {
                assertThat(service.get(saved.id())).isEqualTo(saved);
                assertThat(second.getBean(Flyway.class).info().applied()).hasSize(2);
            } finally { service.delete(saved.id(), saved.version()); }
        }
    }
}
