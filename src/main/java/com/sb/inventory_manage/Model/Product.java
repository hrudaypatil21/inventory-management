package com.sb.inventory_manage.Model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private ProductCategory category;

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @Column(name = "sku", unique = true)
    private String sku;

    @Column(name = "supplier")
    private String supplier;

    @Column(name = "reorder_threshold")
    private Integer reorderThreshold;

    public enum ProductCategory {
        ELECTRONICS("Electronics"),
        CLOTHING("Clothing"),
        FOOD("Food & Beverages"),
        FURNITURE("Furniture"),
        OFFICE_SUPPLIES("Office Supplies"),
        TOYS("Toys & Games"),
        HEALTH("Health & Beauty"),
        SPORTS("Sports & Outdoors"),
        OTHER("Other");

        private final String displayName;

        ProductCategory(String displayName) {
            this.displayName = displayName;
        }

        @Override
        public String toString() {
            return displayName;
        }
    }
}