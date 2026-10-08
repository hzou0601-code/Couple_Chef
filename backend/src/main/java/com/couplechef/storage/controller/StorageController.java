package com.couplechef.storage.controller;

import com.couplechef.common.dto.ApiResponse;
import com.couplechef.storage.model.IngredientRequest;
import com.couplechef.storage.model.IngredientView;
import com.couplechef.storage.service.StorageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/storage")
@Validated
public class StorageController {
    private final StorageService service;

    public StorageController(StorageService service) { this.service = service; }

    @GetMapping({"", "/list"})
    public ApiResponse<List<IngredientView>> list(
        @RequestParam(defaultValue = "") @Size(max = 80) String search,
        @RequestParam(required = false) @Pattern(regexp = "蔬菜|肉禽|水产|蛋奶|主食|调味|其他") String category,
        @RequestParam(required = false) @Min(0) @Max(30) Integer expiringDays) {
        return ApiResponse.success(service.list(search, category, expiringDays));
    }

    @GetMapping("/{id}")
    public ApiResponse<IngredientView> get(@PathVariable @Positive Long id) {
        return ApiResponse.success(service.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<IngredientView> create(@Valid @RequestBody IngredientRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<IngredientView> update(@PathVariable @Positive Long id,
                                             @Valid @RequestBody IngredientRequest request) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable @Positive Long id,
                                    @RequestParam @NotNull @PositiveOrZero Long version) {
        service.delete(id, version);
        return ApiResponse.success(null);
    }
}
