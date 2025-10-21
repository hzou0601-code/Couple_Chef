package com.couplechef.menu.service;

import com.couplechef.menu.model.Dish;
import com.couplechef.menu.repository.DishRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MenuService {
    private final DishRepository DishRepository;

    public MenuService(DishRepository DishRepository) {
        this.DishRepository = DishRepository;
    }

    public List<Dish> getAllDishes() {
        return DishRepository.findAll();
    }

    public Optional<Dish> getDishById(Long id) {
        return DishRepository.findById(id);
    }

    public Dish addDish(Dish Dish) {
        Dish.setAvailable(true);
        return DishRepository.save(Dish);
    }

    public Dish updateDish(Long id, Dish DishData) {
        return DishRepository.findById(id).map(Dish -> {
            Dish.setName(DishData.getName());
            Dish.setDescription(DishData.getDescription());
            Dish.setAvailable(DishData.getAvailable());
            return DishRepository.save(Dish);
        }).orElseThrow(() -> new RuntimeException("菜品不存在"));
    }

    public void deleteDish(Long id) {
        DishRepository.deleteById(id);
    }

    // ⚙️ 预留方法：后续联动 Storage 模块（冰箱库存）
    public List<Dish> getAvailableDishes() {
        return DishRepository.findByAvailableTrue();
    }
}
