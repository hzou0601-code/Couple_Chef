package com.couplechef.menu.controller;

import com.couplechef.common.dto.ApiResponse;
import com.couplechef.menu.model.Dish;
import com.couplechef.menu.service.MenuService;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.File;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin // 允许前端小程序跨域访问
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    /**
     * 获取所有菜品
     */
    @GetMapping
    public ApiResponse<List<Dish>> getAllDishes(HttpServletRequest request) {
        List<Dish> dishes = menuService.getAllDishes();

        // 动态补齐图片路径
        String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
        String imageBasePath = "src/main/resources/static/images/";

        for (Dish dish : dishes) {
            if (dish.getImageUrl() == null || dish.getImageUrl().isBlank()) {
                // 尝试匹配同名图片
                String safeName = URLDecoder.decode(dish.getName(), StandardCharsets.UTF_8);
                File imageFile = new File(imageBasePath + safeName + ".png");

                if (imageFile.exists()) {
                    dish.setImageUrl(baseUrl + "/images/" + dish.getName() + ".png");
                } else {
                    // 不存在则返回默认图片
                    dish.setImageUrl(baseUrl + "/images/default.png");
                }
            } else if (!dish.getImageUrl().startsWith("http")) {
                // 若数据库中存储相对路径，也自动补全完整URL
                dish.setImageUrl(baseUrl + dish.getImageUrl());
            }
        }

        return ApiResponse.success(dishes);
    }

    /**
     * 获取单个菜品
     */
    @GetMapping("/{id}")
    public ApiResponse<Dish> getDishById(@PathVariable Long id, HttpServletRequest request) {
        Optional<Dish> dishOpt = menuService.getDishById(id);
        if (dishOpt.isEmpty()) {
            return ApiResponse.error("菜品不存在");
        }

        Dish dish = dishOpt.get();
        String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();

        if (dish.getImageUrl() == null || dish.getImageUrl().isBlank()) {
            dish.setImageUrl(baseUrl + "/images/default.png");
        }

        return ApiResponse.success(dish);
    }

    /**
     * 新增菜品
     */
    @PostMapping
    public ApiResponse<Dish> addDish(@RequestBody Dish dish) {
        Dish saved = menuService.addDish(dish);
        return ApiResponse.success(saved);
    }

    /**
     * 更新菜品
     */
    @PutMapping("/{id}")
    public ApiResponse<Dish> updateDish(@PathVariable Long id, @RequestBody Dish dish) {
        Dish updated = menuService.updateDish(id, dish);
        return ApiResponse.success(updated);
    }

    /**
     * 删除菜品
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDish(@PathVariable Long id) {
        menuService.deleteDish(id);
        return ApiResponse.success(null);
    }

    /**
     * 获取可制作菜品
     */
    @GetMapping("/available")
    public ApiResponse<List<Dish>> getAvailableDishes() {
        List<Dish> available = menuService.getAvailableDishes();
        return ApiResponse.success(available);
    }
}
