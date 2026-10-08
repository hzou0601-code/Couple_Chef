package com.couplechef.storage.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import com.fasterxml.jackson.databind.DeserializationFeature;
import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class InventoryConfig {
    @Bean
    public Clock inventoryClock() { return Clock.system(ZoneId.of("Australia/Sydney")); }

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer strictIntegerInputs() {
        return builder -> builder.featuresToDisable(DeserializationFeature.ACCEPT_FLOAT_AS_INT);
    }
}
