package com.sb.inventory_manage.Service;

import com.sb.inventory_manage.DTO.TransactionDto;
import com.sb.inventory_manage.DTO.TransactionItemDto;
import com.sb.inventory_manage.Exception.InsufficientStockException;
import com.sb.inventory_manage.Model.Product;
import com.sb.inventory_manage.Model.Transaction;
import com.sb.inventory_manage.Model.TransactionItem;
import com.sb.inventory_manage.Repository.ProductRepository;
import com.sb.inventory_manage.Repository.TransactionRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final ProductRepository productRepository;
    private final TransactionRepository transactionRepository;

    @Autowired
    public TransactionService(ProductRepository productRepository,
                              TransactionRepository transactionRepository) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public TransactionDto createTransaction(TransactionDto transactionDto) {
        // Validate all items first
        for (TransactionItemDto itemDto : transactionDto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + itemDto.getProductId()));

            if (product.getStockQuantity() < itemDto.getQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for product: " + product.getName() +
                                ". Available: " + product.getStockQuantity() +
                                ", Requested: " + itemDto.getQuantity());
            }
        }

        // Process each item and update stock
        List<TransactionItem> transactionItems = transactionDto.getItems().stream()
                .map(itemDto -> {
                    Product product = productRepository.findById(itemDto.getProductId()).orElseThrow();

                    // Update product stock
                    product.setStockQuantity(product.getStockQuantity() - itemDto.getQuantity());
                    productRepository.save(product);

                    // Create transaction item
                    TransactionItem item = new TransactionItem();
                    item.setProduct(product);
                    item.setQuantity(itemDto.getQuantity());
                    return item;
                })
                .collect(Collectors.toList());

        // Create and save transaction
        Transaction transaction = new Transaction();
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setItems(transactionItems);

        Transaction savedTransaction = transactionRepository.save(transaction);

        return mapToDto(savedTransaction);
    }

    public List<TransactionDto> getAllTransactions() {
        return transactionRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private TransactionDto mapToDto(Transaction transaction) {
        List<TransactionItemDto> itemDtos = transaction.getItems().stream()
                .map(item -> new TransactionItemDto(
                        item.getProduct().getId(),
                        item.getQuantity()))
                .collect(Collectors.toList());

        return new TransactionDto(itemDtos);
    }
}