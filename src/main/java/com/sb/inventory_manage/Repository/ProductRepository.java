package com.sb.inventory_manage.Repository;

import com.sb.inventory_manage.Model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(Product.ProductCategory category);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByStockQuantityLessThan(Integer quantity);
}