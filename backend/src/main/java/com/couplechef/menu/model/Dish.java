package com.couplechef.menu.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 菜品实体类
 * 用于记录菜单中每道菜的基本信息、状态和关联食材。
 */
@Entity
@Table(name = "dishes") 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Dish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 菜名 */
    @Column(nullable = false, unique = true)
    private String name;

    /** 描述信息，如“家常菜”、“川菜经典” */
    private String description;

    /** 图片 URL（未来可选） */
    private String imageUrl;

    /** 菜品是否可做（根据库存自动计算） */
    private Boolean available = true;

    /** 口味标签，如“辣”、“清淡”、“下饭” */
    private String tags;

    /** 预留字段：菜谱步骤文本（未来可拆分到独立表） */
    @Lob
    private String recipeSteps;

    /** 最近更新时间 */
    private LocalDateTime updatedAt = LocalDateTime.now();

    /** 
     * ⚙️ 预留食材字段（未来联动 Storage 模块）
     * 目前为简单字符串，后续可改为一对多关联 Ingredient 实体。
     */
    @ElementCollection
    @CollectionTable(name = "dish_ingredients", joinColumns = @JoinColumn(name = "dish_id"))
    @Column(name = "ingredient_name")
    private List<String> ingredients;
}
