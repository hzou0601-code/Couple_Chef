package com.couplechef.menu.repository;

import com.couplechef.menu.model.Dish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * DishRepository
 * 菜品数据访问层，基于 Spring Data JPA。
 */
public interface DishRepository extends JpaRepository<Dish, Long> {

    /**
     * 查询所有可做的菜（available = true）
     */
    List<Dish> findByAvailableTrue();

    /**
     * 按名称模糊查询菜品
     * （用于前端搜索功能）
     */
    List<Dish> findByNameContainingIgnoreCase(String name);

    /**
     * 按标签搜索（如“川菜”、“甜品”等）
     */
    List<Dish> findByTagsContainingIgnoreCase(String tag);

    /**
     * 自定义 SQL 示例：根据库存数量判断菜品可做性（后续 Storage 模块联动）
     */
    @Query("SELECT d FROM Dish d WHERE d.available = true OR d.available IS NULL")
    List<Dish> findAvailableDishesWithStockCheck();
}

