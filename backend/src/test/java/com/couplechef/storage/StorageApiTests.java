package com.couplechef.storage;

import com.couplechef.storage.repository.IngredientRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class StorageApiTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired IngredientRepository repository;
    @MockBean Clock clock;

    @BeforeEach
    void reset() {
        repository.deleteAll();
        // UTC Oct 7 is already Oct 8 in Sydney; locks the date boundary behavior.
        when(clock.getZone()).thenReturn(ZoneId.of("Australia/Sydney"));
        when(clock.instant()).thenReturn(Instant.parse("2026-10-07T14:00:00Z"));
    }

    private String body(String name, String quantity, String unit, String date, Long version) throws Exception {
        var fields = new java.util.HashMap<String, Object>();
        fields.put("name", name); fields.put("quantity", quantity); fields.put("unit", unit);
        fields.put("location", "冷藏"); fields.put("category", "蔬菜");
        if (date != null) fields.put("expiresOn", date);
        if (version != null) fields.put("version", version);
        return mapper.writeValueAsString(fields);
    }

    private JsonNode create(String name, String quantity, String unit, String date) throws Exception {
        var response = mvc.perform(post("/api/storage").contentType("application/json")
            .content(body(name, quantity, unit, date, null)))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.success").value(true))
            .andReturn().getResponse();
        return mapper.readTree(response.getContentAsString()).get("data");
    }

    @Test
    void crudAndEmptyStock() throws Exception {
        mvc.perform(get("/api/storage/list")).andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
        var item = create("西红柿", "1.250", "kg", "2026-10-10");
        long id = item.get("id").asLong();
        mvc.perform(get("/api/storage/{id}", id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.quantity").value(1.25));
        mvc.perform(put("/api/storage/{id}", id).contentType("application/json")
            .content(body("西红柿", "0", "kg", null, 0L))).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.version").value(1)).andExpect(jsonPath("$.data.quantity").value(0));
        mvc.perform(delete("/api/storage/{id}", id).param("version", "1")).andExpect(status().isOk());
        mvc.perform(get("/api/storage/{id}", id)).andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mvc.perform(delete("/api/storage/{id}", id).param("version", "1")).andExpect(status().isNotFound());
        assertThat(repository.count()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"-1", "0.0001", "1000000000", "NaN"})
    void invalidQuantityNeverWrites(String quantity) throws Exception {
        mvc.perform(post("/api/storage").contentType("application/json")
            .content(body("西红柿", quantity, "kg", null, null))).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        assertThat(repository.count()).isZero();
    }

    @Test
    void rejectsMissingFieldsInvalidUnitsDatesAndQueries() throws Exception {
        for (String input : new String[]{"{}", body(" ", "1", "g", null, null),
            body("西红柿", "1", "斤", null, null), body("西红柿", "1", "g", "2026-02-30", null),
            body("西红柿", "1", "g", "+10000-01-01", null)}) {
            mvc.perform(post("/api/storage").contentType("application/json").content(input))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.success").value(false));
        }
        for (String uri : new String[]{"/api/storage?expiringDays=-1", "/api/storage?expiringDays=31",
            "/api/storage?category=invalid", "/api/storage/abc", "/api/storage/0"}) {
            mvc.perform(get(uri)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        }
        assertThat(repository.count()).isZero();
    }

    @Test
    void duplicateNormalizationAndBatchBoundaries() throws Exception {
        create(" ＴＯＭＡＴＯ ", "10", "g", null);
        mvc.perform(post("/api/storage").contentType("application/json")
            .content(body("tomato", "20", "g", null, null))).andExpect(status().isConflict());
        create("tomato", "1", "kg", null);
        create("tomato", "20", "g", "2026-10-09");
        assertThat(repository.count()).isEqualTo(3);
        assertThat(repository.findAll().get(0).getQuantity()).isEqualByComparingTo("10");
    }

    @Test
    void compatibilityWhitespaceCannotBypassDuplicateOrSearch() throws Exception {
        create("西红柿", "10", "g", null);
        String input = body("\u00a0西红柿\u00a0", "20", "g", null, null);
        var fields = (com.fasterxml.jackson.databind.node.ObjectNode) mapper.readTree(input);
        fields.put("location", "\u00a0冷藏\u00a0");
        mvc.perform(post("/api/storage").contentType("application/json").content(fields.toString()))
            .andExpect(status().isConflict());
        mvc.perform(get("/api/storage").param("search", "\u00a0西红柿\u00a0"))
            .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void editingIntoExistingBatchRollsBack() throws Exception {
        create("西红柿", "10", "g", null);
        var other = create("黄瓜", "20", "g", null);
        mvc.perform(put("/api/storage/{id}", other.get("id").asLong()).contentType("application/json")
            .content(body("西红柿", "99", "g", null, 0L))).andExpect(status().isConflict());
        mvc.perform(get("/api/storage/{id}", other.get("id").asLong()))
            .andExpect(jsonPath("$.data.name").value("黄瓜")).andExpect(jsonPath("$.data.quantity").value(20));
    }

    @Test
    void staleUpdateAndDeleteNeverOverwrite() throws Exception {
        var item = create("西红柿", "10", "g", null);
        long id = item.get("id").asLong();
        mvc.perform(put("/api/storage/{id}", id).contentType("application/json")
            .content(body("西红柿", "20", "g", null, null))).andExpect(status().isBadRequest());
        mvc.perform(put("/api/storage/{id}", id).contentType("application/json")
            .content(body("西红柿", "20", "g", null, 0L))).andExpect(status().isOk());
        mvc.perform(put("/api/storage/{id}", id).contentType("application/json")
            .content(body("西红柿", "5", "g", null, 0L))).andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("STALE_VERSION"));
        mvc.perform(delete("/api/storage/{id}", id).param("version", "0")).andExpect(status().isConflict());
        mvc.perform(delete("/api/storage/{id}", id)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/storage/{id}", id)).andExpect(jsonPath("$.data.quantity").value(20));
    }

    @Test
    void fractionalVersionIsRejectedWithoutChangingInventory() throws Exception {
        var item = create("西红柿", "10", "g", null);
        var input = (com.fasterxml.jackson.databind.node.ObjectNode)
            mapper.readTree(body("西红柿", "999", "g", null, 0L));
        input.put("version", 0.9);
        mvc.perform(put("/api/storage/{id}", item.get("id").asLong())
            .contentType("application/json").content(input.toString())).andExpect(status().isBadRequest());
        mvc.perform(get("/api/storage/{id}", item.get("id").asLong()))
            .andExpect(jsonPath("$.data.quantity").value(10)).andExpect(jsonPath("$.data.version").value(0));
    }

    @Test
    void searchCategoryAndExpiryIncludeExpiredButExcludeUndated() throws Exception {
        create("西红柿", "10", "g", "2026-10-07");
        create("西红柿", "10", "g", "2026-10-08");
        create("西红柿", "10", "g", "2026-10-11");
        create("西红柿", "10", "g", "2026-10-12");
        create("西红柿", "10", "g", null);
        mvc.perform(get("/api/storage").param("search", " 红 ").param("category", "蔬菜")
            .param("expiringDays", "3")).andExpect(jsonPath("$.data.length()").value(3));
        mvc.perform(get("/api/storage").param("expiringDays", "0"))
            .andExpect(jsonPath("$.data.length()").value(2));
        mvc.perform(get("/api/storage").param("category", "肉禽")).andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void concurrentDuplicateCreatesOnlyOneBatch() throws Exception {
        String input = body("西红柿", "10", "g", null, null);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CyclicBarrier barrier = new CyclicBarrier(2);
        Callable<Integer> submit = () -> {
            barrier.await(10, TimeUnit.SECONDS);
            return mvc.perform(post("/api/storage").contentType("application/json").content(input))
                .andReturn().getResponse().getStatus();
        };
        try {
            var first = executor.submit(submit);
            var second = executor.submit(submit);
            assertThat(java.util.List.of(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder(201, 409);
            assertThat(repository.count()).isEqualTo(1);
        } finally { executor.shutdownNow(); }
    }
}
