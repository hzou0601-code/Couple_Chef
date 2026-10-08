package com.couplechef.storage.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record IngredientView(Long id, Long version, String name, BigDecimal quantity,
                             String unit, String location, String category, LocalDate expiresOn) {
    public static IngredientView from(Ingredient ingredient) {
        return new IngredientView(ingredient.getId(), ingredient.getVersion(), ingredient.getName(),
            ingredient.getQuantity(), ingredient.getUnit(), ingredient.getLocation(),
            ingredient.getCategory(), ingredient.getExpiresOn());
    }
}
