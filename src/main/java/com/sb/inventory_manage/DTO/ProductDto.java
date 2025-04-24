package com.sb.inventory_manage.DTO;

import com.sb.inventory_manage.Model.Product;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private String name;
    private String description;
    private Product.ProductCategory category;
    private Double price;
    private Integer stockQuantity;
    private String sku;
    private String supplier;
    private Integer reorderThreshold;
}