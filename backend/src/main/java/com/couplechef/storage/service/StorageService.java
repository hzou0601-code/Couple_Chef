package com.couplechef.storage.service;

import com.couplechef.storage.model.*;
import com.couplechef.storage.repository.IngredientRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@Transactional
public class StorageService {
    private final IngredientRepository repository;
    private final Clock clock;

    public StorageService(IngredientRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<IngredientView> list(String search, String category, Integer expiringDays) {
        String query = normalize(search == null ? "" : search);
        LocalDate cutoff = expiringDays == null ? null : LocalDate.now(clock).plusDays(expiringDays);
        return repository.findAll(Sort.by("id")).stream()
            .filter(item -> item.getNormalizedName().contains(query))
            .filter(item -> category == null || category.equals(item.getCategory()))
            .filter(item -> cutoff == null || (item.getExpiresOn() != null
                && !item.getExpiresOn().isAfter(cutoff)))
            .map(IngredientView::from).toList();
    }

    @Transactional(readOnly = true)
    public IngredientView get(Long id) { return IngredientView.from(find(id)); }

    public IngredientView create(IngredientRequest request) {
        Ingredient ingredient = new Ingredient();
        apply(ingredient, request);
        return IngredientView.from(repository.saveAndFlush(ingredient));
    }

    public IngredientView update(Long id, IngredientRequest request) {
        Ingredient ingredient = find(id);
        if (request.version() == null) {
            throw new InventoryException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "编辑时必须提供version");
        }
        if (!Objects.equals(ingredient.getVersion(), request.version())) {
            throw new InventoryException(HttpStatus.CONFLICT, "STALE_VERSION", "库存已更新，请刷新后重试");
        }
        apply(ingredient, request);
        return IngredientView.from(repository.saveAndFlush(ingredient));
    }

    public void delete(Long id, Long version) {
        Ingredient ingredient = find(id);
        if (!Objects.equals(ingredient.getVersion(), version)) {
            throw new InventoryException(HttpStatus.CONFLICT, "STALE_VERSION", "库存已更新，请刷新后重试");
        }
        repository.delete(ingredient);
        repository.flush();
    }

    private Ingredient find(Long id) {
        return repository.findById(id).orElseThrow(() ->
            new InventoryException(HttpStatus.NOT_FOUND, "NOT_FOUND", "食材不存在"));
    }

    private void apply(Ingredient ingredient, IngredientRequest request) {
        String name = Normalizer.normalize(request.name(), Normalizer.Form.NFKC).strip();
        String location = normalize(request.location());
        if (name.isBlank() || name.length() > 80 || location.isBlank() || location.length() > 40
            || normalize(name).length() > 80) {
            throw new InventoryException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "名称或位置不符合长度要求");
        }
        if (request.expiresOn() != null && (request.expiresOn().getYear() < 1 || request.expiresOn().getYear() > 9999)) {
            throw new InventoryException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "到期年份须在1至9999之间");
        }
        ingredient.setName(name);
        ingredient.setNormalizedName(normalize(name));
        ingredient.setQuantity(request.quantity());
        ingredient.setUnit(request.unit());
        ingredient.setLocation(location);
        ingredient.setCategory(request.category());
        ingredient.setExpiresOn(request.expiresOn());
        ingredient.setExpiryKey(request.expiresOn() == null ? "none" : request.expiresOn().toString());
    }

    private String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFKC).strip().toLowerCase(Locale.ROOT);
    }
}
