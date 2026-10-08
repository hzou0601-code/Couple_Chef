package com.couplechef.menu;

import com.couplechef.menu.model.Dish;
import com.couplechef.menu.repository.DishRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class MenuReadRegressionTests {
    @Autowired DishRepository repository;
    @Autowired MockMvc mvc;

    @Test
    void menuCollectionsSerializeWithOpenInViewDisabled() throws Exception {
        repository.deleteAll();
        Dish dish = new Dish();
        dish.setName("番茄炒蛋回归用例");
        dish.setIngredients(List.of("番茄", "鸡蛋"));
        dish.setRecipeSteps("切菜后炒制");
        dish = repository.saveAndFlush(dish);
        try {
            mvc.perform(get("/api/menu")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].ingredients.length()").value(2));
            mvc.perform(get("/api/menu/{id}", dish.getId())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ingredients.length()").value(2));
            mvc.perform(get("/api/menu/available")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].ingredients.length()").value(2));
        } finally { repository.deleteAll(); }
    }
}
