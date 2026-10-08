package com.couplechef.storage.model;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record IngredientRequest(
    @NotBlank @Size(max = 80) String name,
    @NotNull @DecimalMin("0") @Digits(integer = 9, fraction = 3) BigDecimal quantity,
    @NotBlank @Pattern(regexp = "g|kg|ml|l|个") String unit,
    @NotBlank @Size(max = 40) String location,
    @NotBlank @Pattern(regexp = "蔬菜|肉禽|水产|蛋奶|主食|调味|其他") String category,
    LocalDate expiresOn,
    @PositiveOrZero Long version
) {}
